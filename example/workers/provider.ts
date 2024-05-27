
export const auth =  {
	loginUrl: `https://a-ci.ncats.io/_api/auth/ls/authorize`,
	tokenUrl: `https://a-ci.ncats.io/_api/auth/ls/oidc/token`,
	grantType: 2,
	accessTokenName: 'access_token',
	userInfoUrl: `https://a-ci.ncats.io/_api/auth/ls/me`,
	userInfoParser(data: Record<string, unknown>) {
		return {
			id: data.sub,
			name: data.name,
			email: data.email,
			// picture: data.picture,
		};
	},
};