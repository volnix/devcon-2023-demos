import { Component } from 'react';
import { Card, Button, View, Flex, Badge, TextField, Heading, Text, Placeholder } from '@aws-amplify/ui-react';
import { PubSub, Hub, Amplify, Auth } from 'aws-amplify';
import { AWSIoTProvider } from '@aws-amplify/pubsub';
import awsExports from '../aws-exports';
import moment from 'moment';
import { fromCognitoIdentityPool } from "@aws-sdk/credential-providers";
import { IoTClient, AttachPolicyCommand } from '@aws-sdk/client-iot';

export default class Chat extends Component {

  state = {
    user: undefined, messages: [], message_text: ''
  };

  render() {
    if (! this.state.user) {
      return <Placeholder />
    }

    return <View>
      <Flex direction="row" alignItems="flex-start">
        <Card>
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

            <TextField
              placeholder="Enter message..."
              label="Text of message you want to send"
              labelHidden={true}
              onChange={(event) => { this.setState({...this.state, ...{message_text: event.target.value}})}}
              value={this.state.message_text}
            />
            <Button variation="primary"
              onClick={(event) => { PubSub.publish('devcon/chat', {message: this.state.message_text, from: this.state.user, time: moment().toISOString()}); this.setState({...this.state, ...{message_text: ''}}) }}
            >Post Message</Button>

            <Button onClick={() => Auth.signOut()}>Sign Out</Button>
          </Flex>
        </Card>

        <Card>
          <Flex
            direction="column"
            alignItems="flex-start"
          >
            {Object.keys(this.state.messages).map(index => {
              let message = this.state.messages[index];
              return <Text key={index}>
                <Badge variation='info'>{message.from}</Badge> <i>{moment(message.time).format('h:mm:ss')}:</i> "{message.message}"
              </Text>
            })}
          </Flex>
        </Card>

      </Flex>
    </View>
  }

  async componentDidMount() {

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

    // Hub.listen("pubsub", (data) => {
    //   console.debug(data);
    // });

    PubSub.subscribe('devcon/chat').subscribe({
      next: message => {
        console.debug(message); 
        let messages = this.state.messages;
        let payload = message.value;
        messages[moment(payload.time).valueOf()] = payload; // de-dupte
        this.setState({...this.state, ...{messages: messages}}); 
      },
      error: error => { console.error('Error!', error); },
      complete: error => { console.debug('Complete!', error); }
    });

  }
}