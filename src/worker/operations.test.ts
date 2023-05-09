import jwtDecode from 'jwt-decode';
import { createSession, deleteSession, getUserData } from './operations';
import { getState, saveState } from './state';
import { GrantFlow } from '../shared/enums';

jest.mock('./state');
jest.mock('jwt-decode', () => {
	return jest.fn((data) => data);
});

describe('worker/operations', () => {
	afterEach(() => {
		jest.clearAllMocks();
	});

	beforeEach(() => {
		jest.spyOn(globalThis, 'fetch');
	});

	describe('createSession', () => {
		it('should fail if there is no config', async () => {
			const state = {};

			(getState as jest.Mock).mockReturnValue(state);

			await expect(createSession('', 'mockProvider', '', 'example.com')).rejects.toThrow('No config found');
		});

		it('should fail if there is no valid providers', async () => {
			const state = { config: {} };

			(getState as jest.Mock).mockReturnValue(state);

			await expect(createSession('', 'mockProvider', '', 'example.com')).rejects.toThrow(
				'No provider params found (createSession)'
			);
		});

		it('should fail on invalid state', async () => {
			const state = {
				config: {
					providers: {
						mockProvider: {},
					},
					config: {
						mockProvider: {},
					},
				},
			};

			(getState as jest.Mock).mockReturnValue(state);

			await expect(createSession('', 'mockProvider', '123', 'example.com')).rejects.toThrow('Invalid state');
		});

		it('shuld work for token flow', async () => {
			const state = {
				session: {
					provider: 'mockProvider',
				},
				config: {
					providers: {
						mockProvider: {
							stateParam: 'state_param',
							expiresInName: 'expiresIn',
							accessTokenName: 'access',
							grantType: GrantFlow.Token,
							userInfoTokenName: 'user',
						},
					},
					config: {
						mockProvider: {},
					},
				},
			};

			(getState as jest.Mock).mockResolvedValue(state);

			const result = await createSession(
				'state_param=123&expiresIn=12&access=mockAccess&user=mockUserInfo&stuff=test',
				'mockProvider',
				'123',
				'example.com'
			);

			expect(state.session).toEqual({
				provider: 'mockProvider',
				accessToken: 'mockAccess',
				tokenType: 'Bearer',
				refreshToken: undefined,
				expiresAt: 12 * 1000 + Date.now(),
				userInfo: 'mockUserInfo',
			});

			expect(result).toEqual({
				provider: 'mockProvider',
				data: 'mockUserInfo',
			});
		});
	});

	describe('getUserData', () => {
		it('should fail if session data is missing', async () => {
			(getState as jest.Mock).mockResolvedValue({});

			await expect(getUserData()).rejects.toThrow('No session found');
		});

		it('should return the local user info if it exists and parse it', async () => {
			const state = {
				session: {
					provider: 'mockProvider',
					userInfo: 'mockUserInfo',
				},
				config: {
					providers: {
						mockProvider: {
							userInfoParser: jest.fn((data) => data),
						},
					},
				},
			};

			(getState as jest.Mock).mockResolvedValue(state);

			const result = await getUserData();

			expect(result).toEqual({
				provider: 'mockProvider',
				data: 'mockUserInfo',
			});

			expect(state.config.providers.mockProvider.userInfoParser).toHaveBeenCalledWith('mockUserInfo');
			expect(jwtDecode).toHaveBeenCalledWith('mockUserInfo');
		});

		it('should return the local user info if it exists', async () => {
			const state = {
				session: {
					provider: 'mockProvider',
					userInfo: 'mockUserInfo',
				},
				config: {
					providers: {
						mockProvider: {},
					},
				},
			};

			(getState as jest.Mock).mockResolvedValue(state);

			const result = await getUserData();

			expect(result).toEqual({
				provider: 'mockProvider',
				data: 'mockUserInfo',
			});

			expect(jwtDecode).toHaveBeenCalledWith('mockUserInfo');
		});

		it('should return the remote user info if it exists', async () => {
			const state = {
				session: {
					provider: 'mockProvider',
					expiresAt: Date.now() + 3600 * 1000,
				},
				config: {
					providers: {
						mockProvider: {
							userInfoUrl: 'https://example.com/userInfo',
							userInfoParser: jest.fn((data) => data),
						},
					},
				},
			};

			(getState as jest.Mock).mockResolvedValue(state);
			(fetch as jest.Mock).mockResolvedValueOnce(new Response('{"foo": 1}', { status: 200 }));

			const result = await getUserData();
			expect(result).toEqual({
				provider: 'mockProvider',
				data: { foo: 1 },
				expiresAt: state.session.expiresAt,
				expiresAtDate: new Date(state.session.expiresAt),
			});

			expect(state.config.providers.mockProvider.userInfoParser).toHaveBeenCalledWith({ foo: 1 });
		});

		it('should return an error on the server error', async () => {
			const state = {
				session: {
					provider: 'mockProvider',
					expiresAt: Date.now() + 3600 * 1000,
				},
				config: {
					providers: {
						mockProvider: {
							userInfoUrl: 'https://example.com/userInfo',
							userInfoParser: jest.fn((data) => data),
						},
					},
				},
			};

			(getState as jest.Mock).mockResolvedValue(state);
			(fetch as jest.Mock).mockResolvedValueOnce(new Response('{"foo": 1}', { status: 404 }));

			await expect(getUserData()).rejects.toThrow('Could not get user info');
		});

		it('should fail if the provider doesnt have user data', async () => {
			const state = {
				session: {},
			};

			(getState as jest.Mock).mockResolvedValue(state);

			await expect(getUserData()).rejects.toThrow('No way to get user info');
		});
	});

	describe('deleteSession', () => {
		it('should clear the state', async () => {
			const state = {
				session: {},
			};

			(getState as jest.Mock).mockReturnValue(state);

			await deleteSession();

			expect(saveState).toHaveBeenCalled();
			expect(state.session).toBeUndefined();
		});
	});
});
