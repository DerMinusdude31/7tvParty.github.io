const fetch = require('node-fetch');

exports.handler = async function(event, context) {
    // CORS Headers
    const headers = {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Access-Control-Allow-Methods': 'POST, OPTIONS'
    };

    // Handle OPTIONS request (CORS preflight)
    if (event.httpMethod === 'OPTIONS') {
        return {
            statusCode: 204,
            headers
        };
    }

    // Only allow POST
    if (event.httpMethod !== 'POST') {
        return {
            statusCode: 405,
            headers,
            body: JSON.stringify({ error: 'Method not allowed' })
        };
    }

    try {
        const { title, description } = JSON.parse(event.body);

        if (!title || !description) {
            return {
                statusCode: 400,
                headers,
                body: JSON.stringify({ error: 'Title and description are required' })
            };
        }

        const response = await fetch(process.env.DISCORD_WEBHOOK_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                content: null,
                embeds: [{
                    title: `💡 Neue Idee: ${title}`,
                    description,
                    color: 0x4CAF50,
                    timestamp: new Date().toISOString()
                }]
            })
        });

        if (!response.ok) {
            throw new Error(`Discord returned ${response.status}`);
        }

        return {
            statusCode: 200,
            headers,
            body: JSON.stringify({ message: 'Idea submitted successfully' })
        };
    } catch (error) {
        console.error('Error:', error);
        return {
            statusCode: 500,
            headers,
            body: JSON.stringify({ error: 'Internal server error' })
        };
    }
}; 