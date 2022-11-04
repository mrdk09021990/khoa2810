const ItemsModel 	= require(__path_schemas + 'items');
const GroupModel 	= require(__path_schemas + 'groups');
const fs 			= require ('fs');
const FileHelpers   = require(__path_helpers + 'file');
const StringHelpers  = require(__path_helpers + 'string');

module.exports = {
    listItems:  (params , option = null) => {
        
    },

    getItem:  (id , options = null) => {
        return ItemsModel.findById(id);
    },

    countItems:  (params , option = null) => {
        return ItemsModel.count(params.objWhere);
    },

    changeStatus:  (id , currentStatus , options = null ) => {
       
    }, 

    changeOrdering:  async (cids , orderings , options = null ) => {
       
		
	},

    deleteItem:  async ( id , options = null ) => {
       
		if (options.task == "delete-one") {

            await ItemsModel.findById(id).then((item) => {
                FileHelpers.remove('public/uploads/items/' , item.avatar);
            });
            return ItemsModel.deleteOne({_id: id});
        }

        if (options.task == "delete-multi") {
            if(Array.isArray(id)){
                for(let index = 0 ; index < id.length ; index++){
                    await ItemsModel.findById(id[index]).then((item) => {
                        FileHelpers.remove('public/uploads/items/' , item.avatar);
                    });
                }
            }else{
                await ItemsModel.findById(id[index]).then((item) => {
                    FileHelpers.remove('public/uploads/items/' , item.avatar);
                });
            }
            return ItemsModel.remove({_id: {$in: id}});
        }  
	},

    saveItem:  ( item , options = null ) => {
        if  ( options.task == "add") {
				item.created = {
					user_id     : 0,
					user_name   : 'admin',
					time       : Date.now()
				},
				item.slug =	StringHelpers.createAlias(item.slug),
				item.groups = {
					id     : item.groups_id,
					name   : item.groups_name,	
				}
			return new ItemsModel(item).save();
			}
        
        if  ( options.task == "edit") {
            return ItemsModel.updateOne({_id: item.id}, {
                        ordering: parseInt(item.ordering),
                        name			: item.name,
                        content			: item.content,
                        status			: item.status,
                        avatar 			: item.avatar,
                        slug 			: StringHelpers.createAlias(item.slug),
                        groups :  {
                            id     : item.groups_id,
                            name   : item.groups_name,
                        },
                        modified: {
                            user_id     : 0,
                            user_name   : 0,
                            time       : Date.now()
                        }
            })	
        }
    },

    listItemInSelectbox : (params , options = null) => {
        return GroupModel.find({} , {_id: 1 , name: 1})
    }
}
