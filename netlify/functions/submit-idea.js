const fetch = require('node-fetch');

exports.handler = async function(event, context) {
    console.log('Function called');
    console.log('Event:', JSON.stringify(event));
    console.log('Webhook URL exists:', !!process.env.DISCORD_WEBHOOK_URL);

    try {
        const { title, description } = JSON.parse(event.body);
        console.log('Parsed data:', { title, description });

        const webhookUrl = process.env.DISCORD_WEBHOOK_URL;
        if (!webhookUrl) {
            console.error('No webhook URL found');
            throw new Error('Webhook URL not configured');
        }

        console.log('Sending to Discord...');
        const response = await fetch(webhookUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                embeds: [{
                    title: '💡 Neue Idee: ' + title,
                    description: description,
                    color: 0x4CAF50
                }]
            })
        });

        console.log('Discord response status:', response.status);
        const responseText = await response.text();
        console.log('Discord response:', responseText);

        if (!response.ok) {
            throw new Error('Discord API error: ' + response.status);
        }

        return {
            statusCode: 200,
            headers: {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            },
            body: JSON.stringify({ message: 'Idee erfolgreich gesendet' })
        };
    } catch (error) {
        console.error('Error:', error);
        return {
            statusCode: 500,
            headers: {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            },
            body: JSON.stringify({ 
                error: 'Server Error', 
                message: error.message 
            })
        };
    }
}; 