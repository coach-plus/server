export let registerTeamSchema = {
    properties: {
        name: {
            type: 'string',
            required: true
        },
        isPublic: {
            type: 'boolean',
            required: true
        },
        image: {
            type: 'string',
            required: false
        },
    }
}

export let eventSchema = {
    properties: {
        name: {
            type: 'string',
            required: true
        },
        start: {
            type: 'string',
            required: true
        },
        end: {
            type: 'string',
            required: true
        },
        description: {
            type: 'string',
            required: false
        }
    }
}
