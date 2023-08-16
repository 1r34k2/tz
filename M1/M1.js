const http = require("http")
const qs = require("querystring")
const amqp = require('amqplib/callback_api');
function generateUuid() {
    return Math.random().toString() +
           Math.random().toString() +
           Math.random().toString();
  }
const defaultHandler = async (req, res) => {
    res.writeHead(200, {
        "Contetnt-Type": "application/json",
    })
    res.write(
        JSON.stringify({
            message: `API not found at ${req.url}`,
        })
    )
    res.end()
}

const postHandler = (req, res) => {
    let chunks = [];
    req.on("data", (chunk) => {
        chunks.push(chunk);
    });
    req.on("end", async () => {
        const data = Buffer.concat(chunks)
        const parsedData = qs.parse(data.toString())
        res.writeHead(200, {
            "Contetnt-Type": "application/json",
        })
        
        await amqp.connect("amqp://localhost", (error0, connection) =>{
            if (error0) {
                throw error0;
              }
              connection.createChannel(function(error1, channel) {
                if (error1) {
                  throw error1;
                }
              channel.assertQueue('', {
                exclusive: true
              }, function(error2, q) {
                if (error2) {
                  throw error2;
                }
                var correlationId = generateUuid();
                var num = parseInt(parsedData["number"]);

                console.log(' [x] Requesting fib(%d)', num);

                channel.consume(q.queue, function(msg) {
                    if (msg.properties.correlationId == correlationId) {
                        console.log(' [x] Got %s', msg.content.toString());
                        connection.close();
                    }
                }, {
                    noAck: true
                });
                channel.sendToQueue('myQ',
                Buffer.from(num.toString()),{
                correlationId: correlationId,
                replyTo: q.queue });

        }) 

        console.log(
            'Message is sent to queue'
        );
        res.end()
    })
    })
})
}
const server = http.createServer((req, res) => {
    const reqURL = req.url
    const reqMethod = req.method
    switch(reqMethod){
        case "POST":{
            if(reqURL === "/post-api") {
                postHandler(req, res)
            }
            break
        }
        default:{
            defaultHandler(req, res)
        }
    }
})

server.listen(3000, () => {
    console.log("Server is running on Port 3000")
})