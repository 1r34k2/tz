const amqp = require('amqplib/callback_api');
function fib(n){
  if(n === 0 || n === 1) return n
  return fib(n - 1) + fib(n - 2)
}
async function start(){
  amqp.connect('amqp://localhost', function(error0, connection) {
  if (error0) {
    console.log(error0)
  }
  connection.createChannel(function(error1, channel) {
    if (error1) {
      throw error1;
    }
    var queue = 'myQ';

    channel.assertQueue(queue, {
      durable: true
    });
    console.log("Waiting for some tasks...")
    channel.consume(queue, function(msg) {
      console.log(" [x] Received %s", msg.content.toString());
      var n = parseInt(msg.content.toString())
      console.log(" [x] Calculating Fibonacci function...")
      var r = fib(n)
      channel.sendToQueue(msg.properties.replyTo,
        Buffer.from(r.toString()), {
          correlationId: msg.properties.correlationId
        });
        channel.ack(msg);
      console.log(` [x] Result fib(${n}) = ${r} sended back to M1`)
    })
  });
});
}
start()
