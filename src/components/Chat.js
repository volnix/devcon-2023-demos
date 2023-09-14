import { Component } from 'react';
import { Card, Button, View, Flex, Badge, TextAreaField, Heading, Text, Placeholder } from '@aws-amplify/ui-react';
import { PubSub, Hub, Amplify, Auth } from 'aws-amplify';
import { AWSIoTProvider } from '@aws-amplify/pubsub';
import awsExports from '../aws-exports';
import moment from 'moment';
import { fromCognitoIdentityPool } from "@aws-sdk/credential-providers";
import { IoTClient, AttachPolicyCommand } from '@aws-sdk/client-iot';

export default class Chat extends Component {

  state = {
    user: undefined, messages: [], message_text: '', network_requests: [], error: ''
  };

  render() {
    if (! this.state.user) {
      return <Placeholder />
    }

    return <View>
      <Flex 
        direction="row"
        justifyContent="flex-start"
        alignItems="stretch"
        alignContent="flex-start"
        wrap="nowrap"
        gap="1rem"
        padding="2rem"
        >
        <Card style={{ borderRadius: '5px', width: '30rem' }} padding='1rem'>
          <Flex
            direction="column"
            alignItems="flex-start"
          >
            <Flex>
              <Badge size="small" variation="success">
                Logged in as {this.state.user}
              </Badge>
            </Flex>

            <Heading level={5}>
              Chat
            </Heading>

            <TextAreaField
              placeholder="Enter message..."
              label="Text of message you want to send"
              labelHidden={true}
              rows={5}
              onChange={(event) => { this.setState({...this.state, ...{message_text: event.target.value}})}}
              value={this.state.message_text}
              style={{ width: '20rem' }}
              errorMessage={this.state.error}
              hasError={this.state.error}
            />
            <Button variation="primary"
              onClick={(event) => { this.publishMessage(this.state.message_text) }}
            >Post Message</Button>

            <Button onClick={() => Auth.signOut()}>Sign Out</Button>
          </Flex>
        </Card>

        {Object.keys(this.state.messages).length > 0 &&
        <Card>
          <Flex
            direction="column"
            alignItems="flex-start"
          >
            {Object.keys(this.state.messages).map(index => {
              let message = this.state.messages[index];
              return <Text key={'message-' + index}>
                <Badge variation='info'>{message.sender}</Badge> <i>{moment(message.timestamp).format('h:mm:ss')}:</i> "{message.message}"
              </Text>
            })}
          </Flex>
        </Card>
        }

      </Flex>
    </View>
  }

  publishMessage(message) {
    if (! message) {
      this.setState({...this.state, ...{error: 'Enter a non-empty message'}});
      return;
    }

    PubSub.publish('devcon/chat', {message: message, sender: this.state.user, timestamp: moment().toISOString()});
    this.setState({...this.state, ...{message_text: '', error: ''}});
  }

  async componentDidMount() {

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
      awsExports.oauth.redirectSignIn = 'http://localhost:3000/loggedin';
      awsExports.oauth.redirectSignOut = 'http://localhost:3000/signout';
    }

    Amplify.configure(awsExports);

    await Auth.currentAuthenticatedUser().then(async userData => {

        let cognitoId = null;

        await Auth.currentCredentials().then(async userCreds => {
          cognitoId = userCreds.identityId;
        });

        await Auth.currentSession().then(async session => {

          const accessToken = session.getIdToken().getJwtToken();

          const iot = new IoTClient({
            region: 'us-east-1',
            credentials: fromCognitoIdentityPool({
              clientConfig: { region: awsExports.aws_cognito_region },
              identityPoolId: awsExports.aws_cognito_identity_pool_id,
              logins: {
                [`cognito-idp.${awsExports.aws_cognito_region}.amazonaws.com/${userData.pool.userPoolId}`]: accessToken
              }
            })
          });

          const input = { // AttachPolicyRequest
            policyName: 'PubSubAnyTopic',
            target: cognitoId, // required
          };

          const command = new AttachPolicyCommand(input);
          const response = await iot.send(command);
          console.debug('AttachPolicly response: ', response);
        });

        this.setState({...this.state, ...{user: userData.attributes.email}}); 
    }).catch((err) => { console.error(err); window.location = '/login'; });

    Amplify.addPluggable(
      new AWSIoTProvider({
        aws_pubsub_region: 'us-east-1',
        aws_pubsub_endpoint:
          'wss://a2gr1bcxhmj0sj-ats.iot.us-east-1.amazonaws.com/mqtt'
      })
    );

    PubSub.subscribe('devcon/chat').subscribe({
      next: message => {
        console.debug(message); 
        let messages = this.state.messages;
        let payload = message.value;
        messages[moment(payload.timestamp).valueOf()] = payload; // de-dupte
        this.setState({...this.state, ...{messages: messages}}); 
      },
      error: error => { console.error('Error!', error); },
      complete: error => { console.debug('Complete!', error); }
    });

  }
}