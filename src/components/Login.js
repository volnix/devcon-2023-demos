import { useEffect, useState } from 'react';
import { Amplify, Auth, Hub } from 'aws-amplify';
import { Card, Button, View, useTheme, Text, Image } from '@aws-amplify/ui-react';
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

if (isLocalhost) {
  awsConfig.oauth.redirectSignIn = 'http://localhost:3000/loggedin';
  awsConfig.oauth.redirectSignOut = 'http://localhost:3000/signout';
}

Amplify.configure(awsConfig);

function LoginPage() {
  const [user, setUser] = useState(null);
  const { tokens } = useTheme();

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
    <View
      backgroundColor={tokens.colors.background.secondary}
      padding={tokens.space.medium}
    >
      <Card style={{textAlign: 'center'}}>
        <Text variation="primary" padding={tokens.space.large}>{user ? `Logged in as ${user.attributes.email}` : 'Currently logged out'}</Text>
        {user ? (
          <Button onClick={() => Auth.signOut()}>Logut</Button>
        ) : (
          <Image src="./lwa_button.png" onClick={() => Auth.federatedSignIn()} className='lwa_button'/>
          // <Button onClick={() => Auth.federatedSignIn()}>Federated Sign In</Button>
        )}
      </Card>
    </View>
  );
}

export default LoginPage;