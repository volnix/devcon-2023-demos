import { useEffect, useState } from 'react';
import { Amplify, Auth, Hub } from 'aws-amplify';
import { Card, Button } from '@aws-amplify/ui-react';
import awsConfig from '../aws-exports';

const isLocalhost = Boolean(
  window.location.hostname === 'localhost' ||
    // [::1] is the IPv6 localhost address.
    window.location.hostname === '[::1]' ||
    // 127.0.0.1/8 is considered localhost for IPv4.
    window.location.hostname.match(
      /^127(?:\.(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)){3}$/
    )
);

// Assuming you have two redirect URIs, and the first is for localhost and second is for production
const [
  localRedirectSignIn,
  productionRedirectSignIn,
] = awsConfig.oauth.redirectSignIn.split(',');

const [
  localRedirectSignOut,
  productionRedirectSignOut,
] = awsConfig.oauth.redirectSignOut.split(',');

const updatedAwsConfig = {
  ...awsConfig,
  oauth: {
    ...awsConfig.oauth,
    redirectSignIn: isLocalhost ? localRedirectSignIn : productionRedirectSignIn,
    redirectSignOut: isLocalhost ? localRedirectSignOut : productionRedirectSignOut,
  }
}

Amplify.configure(updatedAwsConfig);

function LoginPage() {
  const [user, setUser] = useState(null);

  useEffect(() => {
    Hub.listen('auth', ({ payload: { event, data } }) => {
      switch (event) {
        case 'signIn':
        case 'cognitoHostedUI':
          console.debug(event, data);
          getUser().then(userData => setUser(userData));
          break;
        case 'signOut':
          setUser(null);
          break;
        case 'signIn_failure':
        case 'cognitoHostedUI_failure':
          console.log('Sign in failure', data);
          break;
      }
    });

    getUser().then(userData => setUser(userData));
  }, []);

  async function getUser() {
    return await Auth.currentAuthenticatedUser()
      .then(userData => userData)
      .catch((err) => { console.error(err); console.log('Not signed in'); });
  }

  return (
    <Card>
      <p>User: {user ? JSON.stringify(user.attributes) : 'None'}</p>
      {user ? (
        <Button onClick={() => Auth.signOut()}>Sign Out</Button>
      ) : (
        <Button onClick={() => Auth.federatedSignIn()}>Federated Sign In</Button>
      )}
    </Card>
  );
}

export default LoginPage;