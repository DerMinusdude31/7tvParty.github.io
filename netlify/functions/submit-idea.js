const https = require('https');

exports.handler = async function(event, context) {
    if (event.httpMethod !== 'POST') {
        return {
            statusCode: 405,
            body: JSON.stringify({ message: 'Nur POST-Anfragen erlaubt' })
        };
    }

    try {
        const { title, description } = JSON.parse(event.body);

        if (!title || !description) {
            return {
                statusCode: 400,
                body: JSON.stringify({ message: 'Titel und Beschreibung sind erforderlich' })
            };
        }

        // Discord Webhook Request
        const data = JSON.stringify({
            embeds: [{
                title: '💡 Neue Idee: ' + title,
                description: description,
                color: 0x4CAF50,
                timestamp: new Date().toISOString()
            }]
        });

        return new Promise((resolve, reject) => {
            const webhookUrl = new URL(process.env.DISCORD_WEBHOOK_URL);
            const req = https.request({
                hostname: webhookUrl.hostname,
                path: webhookUrl.pathname,
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Content-Length': data.length,
                }
            }, (res) => {
                let responseBody = '';
                
                res.on('data', (chunk) => {
                    responseBody += chunk;
                });

                res.on('end', () => {
                    if (res.statusCode === 204 || res.statusCode === 200) {
                        resolve({
                            statusCode: 200,
                            body: JSON.stringify({ message: 'Idee erfolgreich gesendet' })
                        });
                    } else {
                        reject(new Error('Discord API Fehler: ' + res.statusCode));
                    }
                });
            });

            req.on('error', (error) => {
                reject(error);
            });

            req.write(data);
            req.end();
        });

    } catch (error) {
        console.error('Fehler:', error);
        return {
            statusCode: 500,
            body: JSON.stringify({ message: 'Server Fehler' })
        };
    }
}; 