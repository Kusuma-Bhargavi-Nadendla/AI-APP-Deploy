const API_URL = process.env.NEXT_PUBLIC_API_URL;
export const validateToken = async (token: string): Promise<boolean> => {
  try {
    const response = await fetch(`${API_URL}/auth/validate-auth-token`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });

    const data = await response.json();
    return data.valid;
  } catch (error) {
    console.error('Token validation failed:', error);
    return false;
  }
};