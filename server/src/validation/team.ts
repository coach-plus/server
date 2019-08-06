export let registerTeamSchema = {
    properties: {
        name: {
            type: 'string',
            required: true,
            minLength: 3
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
            required: true,
            minLength: 3
        },
        start: {
            type: 'string',
            required: true
        },
        end: {
            type: 'string',
            required: true
        },
        location: {
            type: 'object',
            required: true,
            properties: {
                name: {
                    type: 'string',
                    required: true
                },
                latitude: {
                    type: 'number',
                    required: false
                },
                longitude: {
                    type: 'number',
                    required: false
                }
            }
        },
        description: {
            type: 'string',
            required: false
        }
    }
}

export let newsSchema = {
    properties: {
        title: {
            type: 'string',
            required: false
        },
        text: {
            type: 'string',
            required: true
        }
    }
}

