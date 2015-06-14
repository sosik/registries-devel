'use strict';

var path = require('path');
var fs = require('fs');

var schemaRegistryModule = require(path.join(process.cwd(), 'build', 'server', 'schemaRegistry.js'));

var schemaRegistry = new schemaRegistryModule.SchemaRegistry(
	{schemasList: JSON.parse(
		fs.readFileSync(
			path.join(process.cwd(), 'data', 'schemas', '_index.json')
		)).map(function(s){
		return path.join(process.cwd(), 'data', 'schemas', s);
	})}
);

