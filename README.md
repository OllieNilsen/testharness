# Poke generator
The Poke Generator is a CLI tool to generate the set of all possible RFQs, given a config file, specifying the range
 of values for each property in the RFQ schema for a market.
 
 The CLI is built using the Vorpal framework.
## Installation
```bash
npm install
```
## Start

```bash
npm start
```

## Test
```bash
npm test
```

## Important commands
The following is a list of important commands.

#### `help`
Gets a list of all available commands. If a specific command is provided, it gets help for that particular commamd.

Example:
```bash
Poke >> help client create

  Usage: client create [options]

  Alias: cc

  creates a client

  Options:

    --help      output usage information
    -t --token  issue token for the created client

```

#### `client create` (shorthand: `cc`)
Creates a client for a market in spoke.  A client is a user who is allowed to send an RFQ to the relevant market.

##### Options:
* --token (shorthand: -t).  Generate an auth token for the client.

#### `provider create` (shorthand: `pc`)
Creates a client for a market in spoke.  A client is a user who is allowed to send an RFQ to the relevant market.

##### Options:
* `--token` (shorthand: `-t`)`. Generate an auth token for the provider.

#### `generate rfqs` (shorthand: `gen`)
Uses configs for infrastructure, RFQ properties and throttling (see below) to recursively generate RFQs and send them
to Spoke Hub.

## Configuration
There are three different configs for the Poke Generator, one for the Spoke Hub insfrastrucure, one for RFQ properties,
and one for throttling of RFQ requests.

#### Infrastructure
Configures five key infrastructure endpoints:
 * spokeHub. The baseurl for Spoke Hub.
 * providerAuthFunctionName. The ARN for the lambda that creates provider auth tokens.
 * clientAuthFunctionName. The ARN for the lambda that creates client auth tokens.
 * clientAuthDeleteFunctionName. The ARN for the lambda that deletes client auth tokens.
 * providerAuthDeleteFunctionName. The ARN for the lambda that deletes provider auth tokens.

Example:
```json
{
  "spokeHub": "https://example.com",
  "providerAuthFunctionName": "arn:aws:lambda:eu-west-1:00000000000:function:FUNCTION_NAME",
  "clientAuthFunctionName": "arn:aws:lambda:eu-west-1:00000000000:function:FUNCTION_NAME",
  "clientAuthDeleteFunctionName": "arn:aws:lambda:eu-west-1:00000000000:function:FUNCTION_NAME",
  "providerAuthDeleteFunctionName": "arn:aws:lambda:eu-west-1:00000000000:function:FUNCTION_NAME"
}
```

#### RFQ properties
Provides a way to specify the range of values for RFQ properties, as given by the schema for the relevant market.
The config should be structured as a JSON array of objects, where each object specifies the range of values for one
property. The objects should have a `name` property (string), a `type` (`numeric`, `list`, or `boolean`), and (for 
numeric and lists), a `value`. For `numeric` properties, the `value` is an object specifying a `min` value, a `max`
value, and a `step` value.  For `list` properties, the `value` should be an array of possible values. 

Example:

```json
[
  {
    "name": "postcode",
    "type": "list",
    "value": ["EC1Y 2AL", "E1 7HQ", "KT10 8LG", "GL6 9BZ"]
  },
  {
    "name": "dogIsAggro",
    "type": "boolean"
  }
  {
    "name": "dogBreed",
    "type": "list",
    "value": ["Labradoodle", "GoldenRetriever", "Shitzu", "Pug"]
  },
  {
    "name": "walkDays",
    "type": "list",
    "value": [["MON", "THURS"], ["SAT"], ["MON", "WED"], ["FRI", "MON"]]
  },
  {
    "name": "walkTime",
    "type": "list",
    "value": ["AM", "PM"]
  },
  {
    "name": "walkLength",
    "type": "numeric",
    "value": {
      "min": 1,
      "max": 20,
      "step": 2
    }
  }
]

```

#### Throttle
The Throttle config allows you to specify a `delay` between the last response from Spoke Hub for the previous RFQ
request batch and the next RFQ request batch. It also allows you to specify a `batchSize`, i.e. the number of parallel 
RFQ requests to send in each batch. 

Example:
```json
{
  "delay": 500,
  "batchSize": 5
}
```