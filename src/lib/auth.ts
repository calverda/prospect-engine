const TOKEN_VALUE = "authenticated";

export function getAuthToken(): string {
  return TOKEN_VALUE;
}

export function isValidToken(token: string): boolean {
  return token === TOKEN_VALUE;
}
