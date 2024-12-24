const fetch = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args));

exports.handler = async function(event, context) {
    console.log('Funktion wurde aufgerufen');
    console.log('HTTP Method:', event.httpMethod);
    console.log('Environment Variable:', process.env.DISCORD_WEBHOOK_URL ? 'Vorhanden' : 'Fehlt');

    if (event.httpMethod !== 'POST') {
        return {
            statusCode: 405,
            body: JSON.stringify({ message: 'Nur POST-Anfragen erlaubt' })
        };
    }

    try {
        const { title, description } = JSON.parse(event.body);
        console.log('Erhaltene Daten:', { title, description });

        if (!title || !description) {
            return {
                statusCode: 400,
                body: JSON.stringify({ message: 'Titel und Beschreibung sind erforderlich' })
            };
        }

        const webhookUrl = process.env.DISCORD_WEBHOOK_URL;
        if (!webhookUrl) {
            console.error('Webhook URL fehlt');
            throw new Error('Webhook URL nicht konfiguriert');
        }

        const response = await fetch(webhookUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                embeds: [{
                    title: '💡 Neue Idee: ' + title,
                    description: description,
                    color: 0x4CAF50,
                    timestamp: new Date().toISOString()
                }]
            })
        });

        console.log('Discord Response Status:', response.status);

        if (!response.ok) {
            throw new Error('Discord API Fehler: ' + response.status);
        }

        return {
            statusCode: 200,
            body: JSON.stringify({ message: 'Idee erfolgreich gesendet' })
        };
    } catch (error) {
        console.error('Fehler:', error.message);
        return {
            statusCode: 500,
            body: JSON.stringify({ 
                message: 'Server Fehler',
                error: error.message 
            })
        };
    }
}; 