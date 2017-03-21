import * as express from 'express'
import { Validator } from 'jsonschema'


export function validate(jsonSchema: any) {
    return function (target: any, propertyKey: string, descriptor: PropertyDescriptor) {
        let originalMethod = descriptor.value;
        descriptor.value = function (...args: any[]) {
            let req: express.Request = args[0];
            let res: express.Response = args[1];
            let payload = req.body;
            let validator = new Validator();
            let validationResult = validator.validate(payload, jsonSchema);
            if (!validationResult.valid) {
                return res.status(400).send({
                    error: 'your payload is not valid',
                    validationErrors: validationResult.errors
                });
            }
            let result = originalMethod.apply(this, args);
        }
        return descriptor;
    }
}


export let registerUserSchema = {
    properties: {
        firstname: {
            type: 'string',
            required: true
        },
        lastname: {
            type: 'string',
            required: true
        },
        password: {
            type: 'string',
            required: true
        },
        email: {
            type: 'string',
            required: true
        }
    }
}


export let loginUserSchema = {
    properties: {
        password: {
            type: 'string',
            required: true
        },
        email: {
            type: 'string',
            required: true
        }
    }
}