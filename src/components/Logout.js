import React, { Component } from 'react';
import { Card, Button, Text } from '@aws-amplify/ui-react';
import { Auth } from 'aws-amplify';

export default class LogoutPage extends Component {

    render() {
        return <Card>
            <Button onClick={() => { Auth.signOut(); window.location = '/login'; }}>Sign Out</Button>
        </Card>
    }
}