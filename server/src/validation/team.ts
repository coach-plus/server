export let registerTeamSchema = {
    properties: {
        name: {
            type: 'string',
            required: true
        },
         isPublic: {
            type: 'boolean',
            required: true
        }
    }
}