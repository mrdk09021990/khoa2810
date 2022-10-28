const util  = require('util');
const notify= require(__path_configs + 'notify');

const options = {
    name: { min: 5, max: 30 },
    ordering: { min: 0, max: 100 },
    status: { value: 'novalue' },
    groups: { value: 'novalue' },
    content: { min: 1, max: 100 },
    slug:   { min: 1, max: 100 },
    groups: { value: 'value'},
}

module.exports = {
    validator: (req) => {
        // NAME
        req.checkBody('name', util.format(notify.ERROR_NAME, options.name.min, options.name.max) )
            .isLength({ min: options.name.min, max: options.name.max })

        // ORDERING
        req.checkBody('ordering', util.format(notify.ERROR_ORDERING, options.ordering.min, options.ordering.max))
            .isInt({gt: options.ordering.min, lt: options.ordering.max});
        
        // STATUS
        req.checkBody('status', notify.ERROR_STATUS)
            .isNotEqual(options.status.value);

        // groups
        req.checkBody('groups', notify.ERROR_GROUPS) 
            .isNotEqual(options.groups.value);

        // content
        req.checkBody('content', util.format(notify.ERROR_NAME, options.content.min, options.content.max))
            .isLength({ min: options.content.min, max: options.content.max })

        // slug
        req.checkBody('slug', util.format(notify.ERROR_SLUG, options.slug.min, options.slug.max))
            .isLength({ min: options.slug.min, max: options.slug.max })
    }
}