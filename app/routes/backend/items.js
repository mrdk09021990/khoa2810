var express = require('express');
const { Collection } = require('mongoose');
var router 	= express.Router();
const util = require('util');
const modelName = 'items';


const systemConfig  	= require(__path_configs + 'system');
const notify  			= require(__path_configs + 'notify');
const ItemsModel 		= require(__path_schemas + 'items');
const GroupModel 		= require(__path_schemas + 'groups');
const ItemsModel_Models	= require(__path_models + 'items');
const ValidateItems	= require(__path_validates + 'items');
const UtilsHelpers 	= require(__path_helpers + 'items');
const ParamsHelpers = require(__path_helpers + 'params');
const FileHelpers = require(__path_helpers + 'file');

const linkIndex		 = '/' + systemConfig.prefixAdmin + `/${modelName}/`;
const pageTitleIndex = 'items Management';
const pageTitleAdd   = pageTitleIndex + ' - Add';
const pageTitleEdit  = pageTitleIndex + ' - Edit';
const folderView	 = __path_views + `pages/${modelName}/`;
const StringHelpers  = require(__path_helpers + 'string');
const uploadAvatar	 = FileHelpers.upload('avatar' , 'items');

// List items
router.get('(/status/:status)?', async (req, res, next) => {
	let objWhere	 		= {};
	let keyword				= ParamsHelpers.getParam(req.query, 'keyword', '');
	let currentStatus		= ParamsHelpers.getParam(req.params, 'status', 'all'); 
	let statusFilter 		= await UtilsHelpers.createFilterStatus(currentStatus , modelName);
	let sortField			= ParamsHelpers.getParam(req.session, `sort_field`, `name`); 
	let sortType			= ParamsHelpers.getParam(req.session, `sort_type`, `asc`); 
	let groupsID			= ParamsHelpers.getParam(req.session, 'groups_id', 'allvalue'); 
	let sort 				= {};
	sort[sortField]			= sortType;

	let pagination 	 = {
		totalItems		 : 1,
		totalItemsPerPage: 4,
		currentPage		 : parseInt(ParamsHelpers.getParam(req.query, 'page', 1)),
		pageRanges		 : 3
	};


	const groupsItems = await await GroupModel.find({} , {_id: 1 , name: 1})

	groupsItems.unshift({_id: 'allvalue' , name: 'All groups'});

	if(groupsID !== 'allvalue') objWhere['groups.id'] = groupsID ;
	
	if(currentStatus !== 'all') objWhere.status = currentStatus;
	if(keyword !== '') objWhere.name = new RegExp(keyword, 'i');
	
	pagination.totalItems = await ItemsModel.count(objWhere)
	
	ItemsModel
		.find(objWhere)
		.select('name status ordering created modified groups.name slug avatar')
		.sort(sort)
		.skip((pagination.currentPage-1) * pagination.totalItemsPerPage)
		.limit(pagination.totalItemsPerPage)
		.then( (items) => {
			res.render(`${folderView}list`, { 
				pageTitle: pageTitleIndex,
				items,
				statusFilter,
				pagination,
				currentStatus,
				keyword,
				sortField,
				sortType,
				groupsItems,
				groupsID
			});
		});
});

// Change status
router.get('/change-status/:id/:status', (req, res, next) => {
	let currentStatus	= ParamsHelpers.getParam(req.params, 'status', 'active'); 
	let id				= ParamsHelpers.getParam(req.params, 'id', ''); 
	let status			= (currentStatus === "active") ? "inactive" : "active";
	let data			={	
			status     	: status,
			modified: {
				user_id     : 0,
				user_name   : 0,
				time       : Date.now()
			}
		}
	
		ItemsModel.updateOne({_id: id}, data , (err, result) => {
			req.flash('success', notify.CHANGE_STATUS_SUCCESS, false);
			res.redirect(linkIndex);
		});
});

// Change status - Multi
router.post('/change-status/:status', (req, res, next) => {
	let currentStatus	= ParamsHelpers.getParam(req.params, 'status', 'active'); 
	let data			={	
		status     	: currentStatus,
		modified: {
			user_id     : 0,
			user_name   : 0,
			time       : Date.now()
		}
	}
	ItemsModel.updateMany({_id: {$in: req.body.cid }}, data, (err, result) => {
		req.flash('success', util.format(notify.CHANGE_STATUS_MULTI_SUCCESS, result.n) , false);
		res.redirect(linkIndex);
	});
});



// Change ordering - Multi
router.post('/change-ordering', (req, res, next) => {
	let cids 		= req.body.cid;
	let orderings 	= req.body.ordering;
	
	if(Array.isArray(cids)) {
		cids.forEach((item, index) => {
			let data			={	
				ordering : parseInt(ordering[index]),
				modified: {
					user_id     : 0,
					user_name   : 0,
					time       : Date.now()
				}
			}

			ItemsModel.updateOne({_id: item}, data, (err, result) => {});
		})
	}else{ 
		let data			={	
			ordering : parseInt(ordering),
			modified: {
				user_id     : 0,
				user_name   : 0,
				time       : Date.now()
			}
		}
		ItemsModel.updateOne({_id: cids}, data, (err, result) => {});
	}

	req.flash('success', notify.CHANGE_ORDERING_SUCCESS, false);
	res.redirect(linkIndex);
});

// Delete
router.get('/delete/:id', async (req, res, next) => {
	let id				= ParamsHelpers.getParam(req.params, 'id', ''); 

	ItemsModel_Models.deleteItem(id , {task: 'delete-one'}).then((result) => {
		req.flash('success', notify.DELETE_SUCCESS, false);
		res.redirect(linkIndex);
	});
});

// Delete - Multi
router.post('/delete', (req, res, next) => {
	ItemsModel.remove({_id: {$in: req.body.cid }}, (err, result) => {
		req.flash('success', util.format(notify.DELETE_MULTI_SUCCESS, result.n), false);
		res.redirect(linkIndex);
	});
});

// FORM
router.get(('/form(/:id)?'), async (req, res, next) => {
	let id		= ParamsHelpers.getParam(req.params, 'id', '');
	let item	= {name: '', ordering: 0, status: 'novalue' , groups_id: '' , groups_name: '' };
	let errors   = null;
	let groupsItems = [];

	await GroupModel.find({} , {_id: 1 , name: 1}).then((items) =>{
		groupsItems = items;
		groupsItems.unshift({_id: 'novalue' , name: 'Choose groups'});
	})
	if(id === '') { // ADD
		res.render(`${folderView}form`, { pageTitle: pageTitleAdd, item, errors , groupsItems});
	}else { // EDIT
		ItemsModel.findById(id, (err, item) =>{
			item.groups_id = item.groups.id;
			item.groups_name = item.groups.name;
			res.render(`${folderView}form`, { pageTitle: pageTitleEdit, item, errors , groupsItems});
		});	
	}
});

// SAVE = ADD EDIT
router.post('/save',  (req, res, next) => {
	uploadAvatar (req, res, async (errUpload) => {
		
		req.body = JSON.parse(JSON.stringify(req.body));
		ValidateItems.validator(req);

		let item = Object.assign(req.body);
		let errors = req.validationErrors();

		if (errUpload){
			errors.push({param: 'avatar' , msg: errUpload});
		}

		let taskCurrent = (typeof item !== "undefined" && item.id !== "") ? "edit" : "add";

		if (errors) {
			let pageTitle = (taskCurrent == "add") ? pageTitleAdd : pageTitleEdit;
			FileHelpers.remove('public/uploads/items/' , req.file.filename);
			let groupsItems = [];
			await ItemsModel_Models.listItemInSelectbox().then((items) =>{
				groupsItems = items;
				groupsItems.unshift({_id: 'allvalue' , name: 'All groups'});
			})
		}else{
			let message = (taskCurrent == "add") ? notify.EDIT_SUCCESS : notify.EDIT_SUCCESS;
			item.avatar =req.file.filename;
			ItemsModel_Models.saveItem(item , {task: taskCurrent}).then((result) => {
				req.flash('success', message , false);
				res.redirect(linkIndex);
			})
		}
			
	});		
});

//---------SORT-------------

router.get(('/sort/:sort_field/:sort_type') , (req, res, next) => {
	req.session.sort_field		= ParamsHelpers.getParam(req.params, `sort_field`, `ordering`);
	req.session.sort_type 		= ParamsHelpers.getParam(req.params, `sort_type`, `asc`);
   
	res.redirect(linkIndex);
   });

//---------filter-group------------

router.get(('/filter-groups/:groups_id') , (req, res, next) => {
	req.session.groups_id		= ParamsHelpers.getParam(req.params, 'groups_id' , '');
	res.redirect(linkIndex);
   });



// //---------tao phuong thuc up file anh ------------

   

// //---------up load from ------------
// router.get('/upload' , (req, res, next) => {
// 	let errors   = null;
// 	res.render(`${folderView}upload` , {pageTitle: pageTitleIndex , errors})
// });

// //---------up load post ------------
// router.post('/upload'  , (req, res, next) => {
// 	let errors   = [];
// 	uploadAvatar (req, res, function(err){
// 		if (err){
// 			errors.push({param: 'avatar' , msg: err});
// 		}
// 		res.render(`${folderView}upload` , {pageTitle: pageTitleIndex , errors})
// 	})
	
// });

module.exports = router;

