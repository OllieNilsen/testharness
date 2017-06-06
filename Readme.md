# util_TestHarness
Module to create fake RFQ's, iterating over all possible values
of properties of an RFQ.

## Installation
```bash
git clone git@spokedev.githost.io:spokedev/util_rfqharness.git
cd util_testHarness
npm i
```

## Configuration
The `config.json` file comes with a full, working example. It has two parts, the 
`throttle` and `rfqProperties`.

#### Throttle configuration
The `throttle` settings govern the rate at which RFQs are generated and sent to the rfqEngine.
In order to modify the *overall number* of RFQs to generate, modify the `rfqProperties` (see below).
###### Delay
The throttle can be configured with a `delay`, in milliseconds. This property causes the
system to pause for the given amount of milliseconds after receiving responses 
for the previous batch of rfqs from the rfqEngine, before sending off the next batch.

###### BatchSize
The number of rfqs to generate in each batch is configured by the `batchSize` property.
In the example, this property is set to `5`, because of the limitations on DB writes in
the RfqEngine.  In the future, this limit may be increased, allowing for higher
batchSizes.

#### Configuring RFQ properties
Each `rfqProperty` needs to have a `name` (string), a `type` (string), and, for some types, 
a `value` (object). There are three supported types: `list`, `numeric`, and `boolean`.

###### Booleans
Boolean properties are the simplest ones, in that they don't require a `value` property. 
The possible values for a boolean is `true`, and `false`. Example:
```json
{
      "name": "hasLegs",
      "type": "boolean"
}
```
###### Lists
A `list` property can take one out of a limited set of values, e.g. *gender*, "male", "female", 
or *currency*, "GBP", EUR", "USD", etc.  To configure a list property, use the `list`
type and set the `value` to be an array consisting of all the possible (or supported, desirable, etc.) values.
Example:
```json
{
      "name": "termPeriod",
      "type": "list",
      "value": ["years","months","days"]
}
```
###### Numerics
A `numeric` property is an `int`. To configure one, use the `numeric` type, and 
set the value as an object with a `min`, a `max` and a `step` property.  `min` is 
the minimal value, `max` the maximal value, and `step` is the distance between each value
generated.  For example, the following `numeric` property:
```json
 {
      "name": "age",
      "type": "numeric",
      "value": {
        "min": 10,
        "max": 16,
        "step": 2
      }
    }
```
would generate all *even* ints between 10 and 16, i.e., `10, 12, 14, 16`.

## Usage
```bash
npm start
Spoke|- generate Rfqs
```
The `generate Rfqs` command will run a recursive function to produce all possible combinations of properties,
as defined in the `config.json` file. It will make `POST` requests to the RFQ Engine (the url is currently hardcoded
in cli.js (line 30).  Needless to say, this process may take a *long* time to finish. If you want to terminate
the process, type `ctrl c` and then `ctrl d`.

## Test
```bash
npm test
```