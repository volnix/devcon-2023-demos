import React, { Component } from 'react';
import { Card, Button, Text } from '@aws-amplify/ui-react';
import { Auth } from 'aws-amplify';

export default class LogoutPage extends Component {

    constructor(props) {
        super(props);
        Auth.signOut();
    }

    render() {
        return <Card>
            <Text>You have been logged out.</Text>
            <Button
                onClick={() => window.location = '/login' }
            >
                Back to Login
            </Button>
        </Card>
    }
}