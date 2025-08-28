export const getURL = () => {
  let url =
    process.env.REACT_APP_SITE_URL ||
    process.env.PUBLIC_URL ||
    'http://localhost:3000/';

  // Ensure protocol
  url = url.startsWith('http') ? url : `https://${url}`;
  // Ensure trailing slash
  url = url.endsWith('/') ? url : `${url}/`;
  return url;
};
