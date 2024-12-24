const fetch = require('node-fetch');

exports.handler = async function(event, context) {
    // Nur POST-Anfragen erlauben
    if (event.httpMethod !== 'POST') {
        return {
            statusCode: 405,
            body: JSON.stringify({ message: 'Nur POST-Anfragen erlaubt' })
        };
    }

    try {
        const { title, description } = JSON.parse(event.body);

        // Überprüfe die Eingaben
        if (!title || !description) {
            return {
                statusCode: 400,
                body: JSON.stringify({ message: 'Titel und Beschreibung sind erforderlich' })
            };
        }

        // Sende die Nachricht an Discord
        const response = await fetch(process.env.DISCORD_WEBHOOK_URL, {
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

        if (!response.ok) {
            throw new Error('Discord API Fehler');
        }

        return {
            statusCode: 200,
            body: JSON.stringify({ message: 'Idee erfolgreich gesendet' })
        };
    } catch (error) {
        console.error('Fehler:', error);
        return {
            statusCode: 500,
            body: JSON.stringify({ message: 'Server Fehler' })
        };
    }
}; 