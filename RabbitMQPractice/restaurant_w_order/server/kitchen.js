const amqp = require("amqplib/callback_api");

// Kitchens can process different food types
const foodTypes = process.argv.slice(2);  // e.g., ['pizza', 'pasta']

amqp.connect("amqp://localhost", function (error0, connection) {
  if (error0) {
    throw error0;
  }
  connection.createChannel(function (error1, channel) {
    if (error1) {
      throw error1;
    }

    const exchange = "food_orders";

    channel.assertExchange(exchange, "topic", { durable: true });

    channel.assertQueue("", { exclusive: true }, function (error2, q) {
      if (error2) {
        throw error2;
      }

      console.log(" [*] Waiting for orders of %s.", foodTypes.join(", "));

      // Bind each kitchen queue to the corresponding food types
      foodTypes.forEach((foodType) => {
        channel.bindQueue(q.queue, exchange, foodType);
      });

      channel.consume(q.queue, function (msg) {
        const order = JSON.parse(msg.content.toString());
        console.log(" [x] Kitchen received order: ", order);

        setTimeout(function () {
          console.log(" [x] Kitchen finished cooking %s", order.name);
          channel.ack(msg);
        }, order.quantity * 1000);  // Simulate cooking time based on quantity
      }, { noAck: false });
    });
  });
});
