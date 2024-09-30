const express = require("express");
const bodyParser = require("body-parser");
const amqp = require("amqplib/callback_api");

const app = express();

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));

// Create a route to place an order
app.post("/placeorder", (req, res) => {
  const orderItem = {
    id: req.body.id,
    name: req.body.name,  // e.g., 'Pizza'
    quantity: req.body.quantity
  };

  amqp.connect("amqp://localhost", function (error0, connection) {
    if (error0) {
      throw error0;
    }
    connection.createChannel(function (error1, channel) {
      if (error1) {
        throw error1;
      }

      const exchange = "food_orders";
      const key = req.body.name.toLowerCase();  // The routing key (food type)

      channel.assertExchange(exchange, "topic", { durable: true });

      channel.publish(exchange, key, Buffer.from(JSON.stringify(orderItem)), {
        persistent: true
      });

      console.log(" [x] Sent %s: '%s'", key, JSON.stringify(orderItem));
      res.send("Order placed!");
    });
  });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
