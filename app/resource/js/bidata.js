if($ == undefined){
	$ = jQuery;
}
var dataType = ["String", "Int", "Double", "Date"];
var dateformat = ['yyyymmdd', 'yyyy-mm-dd', 'yyyy年mm月dd日', 'yyyymm', 'yyyy-mm', 'yyyy年mm月', 'yyyyqq' ,'yyyy-qq', 'yyyy年qq季度', 'yyyy', 'yyyy年'];
function selectcube(){
	var ctx = "<table class=\"grid3\" id=\"T_report54\" cellpadding=\"0\" cellspacing=\"0\">" + 
		"<tr style=\"background-color:#FFF\">" + 
		"<th width=\"10%\">选择</th><th width=\"10%\">序号</th><th width=\"40%\">立方体名称</th><th width=\"40%\">立方体说明</th></tr>";
	for(i=0; pageInfo.cube && i<pageInfo.cube.length; i++){
		var o = pageInfo.cube[i];
		ctx = ctx + "<tr><td class='kpiData1 grid3-td'><input type=\"checkbox\" id=\"selectdataset\" name=\"selectdataset\" value=\""+o.id+"\" /></td><td class='kpiData1 grid3-td'>"+(i + 1)+"</td><td class='kpiData1 grid3-td'>"+o.name+"</td><td class='kpiData1 grid3-td'>"+o.note+"</td></tr>";
	}
	if(!pageInfo.cube || pageInfo.cube.length == 0){
		ctx = ctx + "<tr><td class='kpiData1 grid3-td' align='center' colspan=\"4\">无数据，请先建立数据模型。</td></tr>";
	}
	ctx = ctx + "</table>";
	$('#pdailog').dialog({
		title: '选择多维立方体',
		width: 640,
		height: 340,
		closed: false,
		cache: false,
		modal: true,
		toolbar:null,
		content:ctx,
		buttons:[{
					text:'确定',
					handler:function(){
						var chk = jQuery("input[name='selectdataset']:checkbox:checked");
						var ret = "";
						chk.each(function(a, b){
							ret = ret + $(this).val();
							if(chk.size() -1 != a){
								ret = ret + ",";
							}
						});
						if(ret != ''){
							pageInfo.selectDs = ret;	
							//更新selectdatatree
							initselectDataTree();
							
							//让数据tab项选中
							$("#l_tab").tabs("select", 0);
						}
						//更新页面为已修改
						curTmpInfo.isupdate = true;
						$('#pdailog').dialog('close');
					}
				},{
					text:'取消',
					handler:function(){
						$('#pdailog').dialog('close');
					}
				}]
	});
}
function selectAllcube(){
	var func = function(resp){
		var ctx = "<table class=\"grid3\" id=\"T_report54\" cellpadding=\"0\" cellspacing=\"0\">" + 
			"<tr style=\"background-color:#FFF\">" + 
			"<th width=\"10%\">选择</th><th width=\"30%\">立方体名称</th><th width=\"30%\">立方体说明</th><th width=\"30%\">所属文件</th></tr>";
		for(i=0; resp && i<resp.length; i++){
			var o = resp[i];
			ctx = ctx + "<tr><td class='kpiData1 grid3-td'><input type=\"radio\" id=\"selectdataset\" name=\"selectdataset\" value=\""+o.fileId+","+o.cubeId+"\" /></td><td class='kpiData1 grid3-td'>"+o.cubeName+"</td><td class='kpiData1 grid3-td'>"+o.note+"</td><td class='kpiData1 grid3-td'>"+o.fileName+"</td></tr>";
		}
		if(!resp || resp.length == 0){
			ctx = ctx + "<tr><td class='kpiData1 grid3-td' align='center' colspan=\"4\">无数据。</td></tr>";
		}
		ctx = ctx + "</table>";
		$('#pdailog').dialog({
			title: '选择多维立方体',
			width: 640,
			height: 340,
			closed: false,
			cache: false,
			modal: true,
			toolbar:null,
			content:ctx,
			buttons:[{
						text:'确定',
						handler:function(){
							var chk = $("input[name='selectdataset']:radio:checked");
							var val = chk.val();
							if(!val){
								msginfo("请选择立方体。");
								return;
							};
							var vls = val.split(",");
							getCubeData(vls[0],vls[1]);
							curTmpInfo.isupdate = true;
							$('#pdailog').dialog('close');
						}
					},{
						text:'取消',
						handler:function(){
							$('#pdailog').dialog('close');
						}
					}]
		});
	}
	$.ajax({
	   type: "POST",
	   url: "Cube!getAllAuthCubes.action",
	   dataType:"json",                                           
	   data: {},
	   success: function(resp){
		  func(resp);
	   },
	   error:function(resp){
		   $.messager.alert('出错了','系统出错，请联系管理员。','error');
	   }
	});
}
function getCubeData(fileId, cubeId){
	$.ajax({
	   type: "POST",
	   url: "Cube!getCubeInfo.action",
	   dataType:"json",                                           
	   data: {"fileId":fileId, "cubeId":cubeId},
	   success: function(resp){
		  pageInfo.cube = [resp.cube];
		  pageInfo.datasource = [resp.dsource];
		  pageInfo.dataset = [resp.dataset];
		  pageInfo.selectDs = cubeId;	
		  //更新selectdatatree
		  initselectDataTree();
	   },
	   error:function(resp){
		   $.messager.alert('出错了','系统出错，请联系管理员。','error');
	   }
	});
}
function initselectDataTree(){
	var existDt = false;
	if(pageInfo.selectDs && pageInfo.selectDs!=''){
		var cubes = pageInfo.selectDs.split(",");
		var dt = [];
		var cubeIdx = 0;
		for(i=0;i<cubes.length;i++){
			var cube = fundCubeById(cubes[i]);
			if(cube == null){ //当前立方体已经被删除了
				continue;
			}
			existDt = true;
			dt.push({id:cube.id,text:cube.name, iconCls:'icon-cube',children:[{id:'data_wd',text:'维度',iconCls:'icon-dim',children:[],attributes:{drag:'n'}},{id:'data_dl',text:'度量',iconCls:'icon-kpi',children:[],attributes:{drag:'n'}}],attributes:{drag:'n'}});
			var dim = cube.dim;
			var ac = cube.aggreTable || cube.divison ? true : false; 
			var idx = 0;
			for(j=0; dim&&j<dim.length; j++){
				var d = dim[j];
				if(d.tp == 'dim'){
					dt[cubeIdx].children[0].children.push({id:d.id, text:d.name, iconCls:'icon-dim', attributes:{col_type:1,tid:cube.id,col_id:d.id,dim_type:'frd',col:(ac?d.refId:d.col),iscas:'n',tname:(d.tname),tableName:d.codetable,tableColKey:d.keycol,tableColName:d.valcol,dimord:null,dim_name:d.col,grouptype:"",valType:(d.vtype?d.vtype:"number"),dyna:(d.dyna?d.dyna:false),dateformat:(d.dateformat?d.dateformat:""),ord:idx}});
					idx++;
				}else if(d.tp == 'group'){
					var t = {id:d.id, text:d.name, iconCls:'icon-group', attributes:{drag:'n'}, children:[]};
					dt[cubeIdx].children[0].children.push(t);
					for(k=0; k<d.children.length; k++){
						var tt = d.children[k];
						t.children.push({id:tt.id, text:tt.name, iconCls:'icon-dim', attributes:{col_type:1,tid:cube.id,col_id:tt.id,dim_type:(!tt.dimtype||tt.dimtype==''?'frd':tt.dimtype),col:(ac?tt.refId:tt.col),iscas:(k==0?'n':'y'),tname:(tt.tname),tableName:tt.codetable,tableColKey:tt.keycol,tableColName:tt.valcol,dimord:null,dim_name:tt.col,grouptype:(!d.grouptype||d.grouptype.length==0?(d.id+""):d.grouptype),valType:(tt.vtype?tt.vtype:"number"),dyna:(tt.dyna?tt.dyna:false),dateformat:(tt.dateformat?tt.dateformat:""),ord:idx}});
						idx++;
					}
				}
			}
			var kpi = cube.kpi;
			for(j=0; kpi&&j<kpi.length; j++){
				var k = kpi[j];
				var alias = k.aggre+"_" + k.id; //查询SQL的别名是 aggre+id
				dt[cubeIdx].children[1].children.push({id:k.id, text:k.name, iconCls:(k.calc?'icon-ckpi':'icon-kpi'), attributes:{col_type:2,tid:cube.id,col_id:k.id,col_name:k.col,tname:(k.tname),aggre:k.aggre,fmt:k.fmt,alias:alias,unit:k.unit,rate:null,calc:(k.calc==true?true:false),dyna:(k.dyna?k.dyna:false)}});
			}
			cubeIdx = cubeIdx + 1;
		}
		$("#selectdatatree").tree({
			dnd:true,
			lines:true,
			data:dt,
			onBeforeDrag:function(target){
				if(target.attributes && target.attributes.drag == 'n'){
					return false;
				}
				return true;
			},
			onDragEnter:function(target, source){
				return false;
			},
			onContextMenu: function(e, node){
				msginfo("拖拽维度或度量到组件内进行数据分析。","info");
				e.preventDefault();
			}
		});
	}
	if(!existDt)
	{
		$("#selectdatatree").tree({
			dnd:false,
			data:[{id:'nodata', text:'您还未选择立方体数据。', iconCls:'icon-no'}]
		});
	}
}
function newdatasource(isupdate){
	var ds;
	if(isupdate){
		ds = findDatasourceById(curTmpInfo.id);
	}
	var ctx = "<div id=\"dsource_tab\" style=\"height:auto; width:auto;\"><div title=\"JDBC\"><form id=\"datasourceform\" name=\"datasourceform\"><input type=\"hidden\" name=\"connstate\" id=\"connstate\"><div class=\"textpanel\"><span class=\"inputtext\">数据源名称：</span><input type=\"text\" id=\"dsname\" name=\"dsname\" class=\"inputform\" value=\""+(ds&&ds.use=='jdbc'?ds.dsname:"")+"\" style=\"width:260px;\"><br/><span class=\"inputtext\">数据源类型：</span><select id=\"linktype\" name=\"linktype\" class=\"inputform\" style=\"width:260px;\"><option value=\"mysql\" "+(ds&&ds.use=='jdbc'&&ds.linktype=='mysql'?"selected":"")+">MYSQL</option><option value=\"oracle\" "+(ds&&ds.use=='jdbc'&&ds.use=='jdbc'&&ds.linktype=='oracle'?"selected":"")+">ORACLE</option><option value=\"sqlserver\" "+(ds&&ds.use=='jdbc'&&ds.linktype=='sqlserver'?"selected":"")+">SQL Server</option></select><br/><span class=\"inputtext\">连接字符串：</span><input type=\"text\" id=\"linkurl\" name=\"linkurl\" class=\"inputform\" style=\"width:260px;\" value=\""+(ds&&ds.use=='jdbc'?ds.linkurl:"jdbc:mysql://ip/database?useUnicode=true&characterEncoding=UTF8")+"\"><br/><span class=\"inputtext\">连接用户名：</span><input type=\"text\" id=\"linkname\" name=\"linkname\" class=\"inputform\" style=\"width:260px;\" value=\""+(ds&&ds.use=='jdbc'?ds.linkname:"")+"\"> <br/><span class=\"inputtext\">连接密码：</span><input type=\"password\" name=\"linkpwd\" id=\"linkpwd\" class=\"inputform\" style=\"width:260px;\" value=\""+(ds&&ds.use=='jdbc'?encoder(ds.linkpwd,"decode"):"")+"\"></div></form></div><div data-options=\""+(ds&&ds.use=='jndi'?"selected:true":"")+"\" title=\"JNDI\"><div class=\"textpanel\"><span class=\"inputtext\">JNDI名称：</span><input type=\"text\" value=\""+(ds&&ds.use=='jndi'?ds.jndiname:"")+"\" class=\"inputform\" name=\"jndiname\" id=\"jndiname\" style=\"width:260px;\"></div></div></div>";
	$('#pdailog').dialog({
		title: isupdate ? "编辑数据源" : '创建数据源',
		width: 410,
		height: 270,
		closed: false,
		cache: false,
		modal: true,
		toolbar:null,
		onLoad:function(){
		},
		content:ctx,
		buttons:[{
			text:"测试连接",
			handler:function(){
				var tab = $('#dsource_tab').tabs('getSelected');
				var index = $('#dsource_tab').tabs('getTabIndex',tab);
				if(index == 0){
					var param = $("#datasourceform").serialize();
					$.ajax({
					   type: "POST",
					   url: "Data!testConn.action",
					   dataType:"json",
					   data: param,
					   success: function(resp){
						   if(resp.ret){
							   msginfo("测试成功！", "suc");
							   $("#datasourceform #connstate").val("y");
						   }else{
							   msginfo("测试失败！");
						   }
					   }
					});
				}else if(index == 1){
					var param = {"jndiname":$("#dsource_tab #jndiname").val()};
					$.ajax({
					   type: "POST",
					   url: "Data!testJNDI.action",
					   dataType:"json",
					   data: param,
					   success: function(resp){
						   if(resp.ret){
							   msginfo("测试成功！", "suc");
							   $("#datasourceform #connstate").val("y");
						   }else{
							   msginfo("测试失败！");
						   }
					   }
					});
				}
			}
		},{
				text:'确定',
				handler:function(){
					var tab = $('#dsource_tab').tabs('getSelected');
					var index = $('#dsource_tab').tabs('getTabIndex',tab);
					if(index == 0){
						if($("#datasourceform #dsname").val() == ''){
							msginfo("请输入数据源名称！");
							$("#datasourceform #dsname").focus();
							return;
						}
						if($("#datasourceform #connstate").val() != "y"){
							msginfo("请先测试连接正常再确定！");
							return;
						}
						if(isupdate == false){
							var ds = {"linktype":$("#linktype").val(), "linkname":$("#linkname").val(), "linkpwd":encoder($("#linkpwd").val(),"encode"), "linkurl":$("#linkurl").val(),"dsname":$("#datasourceform #dsname").val(),"dsid":newGuid(),"use":"jdbc"};
							if(!pageInfo.datasource){
								pageInfo.datasource = [];
							}
							pageInfo.datasource.push(ds);
							//给tree添加节点
							$("#mydatatree").tree("append", {parent:$("#mydatatree div[node-id='sjy']"), data:[{id:ds.dsid, text:ds.dsname, iconCls:"icon-dsource",attributes:{showmenu:true,type:'dsource'}}]});
							//展开节点
							$("#mydatatree").tree("expand", $("#mydatatree div[node-id='sjy']"));
							$("#l_tab").tabs("select", 1);
						}else{
							for(i=0;i<pageInfo.datasource.length;i++){
								if(pageInfo.datasource[i].dsid == curTmpInfo.id){
									datasource = pageInfo.datasource[i];
									datasource.linktype = $("#linktype").val();
									datasource.linkname = $("#linkname").val();
									datasource.linkpwd = encoder($("#linkpwd").val(),"encode")
									datasource.linkurl = $("#linkurl").val();
									datasource.dsname = $("#dsname").val();
									datasource.use = "jdbc";
									var node = $('#mydatatree').tree('getSelected');
									$('#mydatatree').tree('update', {target:node.target, text:datasource.dsname});
									break;
								}
							}
						}
					}else if(index == 1){
						if($("#dsource_tab #jndiname").val() == ''){
							msginfo("请输入JNDI名称！");
							$("#dsource_tab #jndiname").focus();
							return;
						}
						if($("#datasourceform #connstate").val() != "y"){
							msginfo("请先测试连接正常再确定！");
							return;
						}
						if(isupdate == false){
							var ds = {"jndiname":$("#dsource_tab #jndiname").val(),"dsid":newGuid(),"use":"jndi"};
							if(!pageInfo.datasource){
								pageInfo.datasource = [];
							}
							pageInfo.datasource.push(ds);
							//给tree添加节点
							$("#mydatatree").tree("append", {parent:$("#mydatatree div[node-id='sjy']"), data:[{id:ds.dsid, text:ds.jndiname, iconCls:"icon-dsource",attributes:{showmenu:true,type:'dsource'}}]});
							//展开节点
							$("#mydatatree").tree("expand", $("#mydatatree div[node-id='sjy']"));
							$("#l_tab").tabs("select", 1);
						}else{
							for(i=0;i<pageInfo.datasource.length;i++){
								if(pageInfo.datasource[i].dsid == curTmpInfo.id){
									datasource = pageInfo.datasource[i];
									datasource.jndiname = $("#jndiname").val();
									datasource.use = "jndi";
									var node = $('#mydatatree').tree('getSelected');
									$('#mydatatree').tree('update', {target:node.target, text:datasource.jndiname});
									break;
								}
							}
						}
					}
					curTmpInfo.isupdate = true;
					$('#pdailog').dialog('close');
				}
			},{
				text:'取消',
				handler:function(){
					$('#pdailog').dialog('close');
				}
			}]
	});
	$("#pdailog #dsource_tab").tabs({
		fit:true,border:false
	});
	$("#pdailog #linktype").change(function(){
		var val = $(this).val();
		if(val == "mysql"){
			$("#pdailog #linkurl").val("jdbc:mysql://ip/database?useUnicode=true&characterEncoding=UTF8");
		}else if(val == "oracle"){
			$("#pdailog #linkurl").val("jdbc:oracle:thin:@ip:1521:sid");
		}else if(val == "sqlserver"){
			$("#pdailog #linkurl").val("jdbc:jtds:sqlserver://ip:1433/database");
		}
	});
}
function initmydatatree(opdset){
	var dt = [{text: '数据源',
			id:'sjy',
			state: 'closed',
			iconCls:"icon-dsource",
			attributes:{showmenu:true, onlyAdd:true}
		},{
			text: '数据集',
			id:'sjj',
			state: (opdset ? 'open' : 'closed'),
			iconCls:"icon-dataset2",
			attributes:{showmenu:true, onlyAdd:true}
		},{
			text:'立方体',
			id:'lft',
			state: 'closed',
			iconCls: "icon-cube",
			attributes:{showmenu:true, onlyAdd:true}
		}];
	if(pageInfo.datasource){
		dt[0].children = [];
		for(var i=0; i<pageInfo.datasource.length; i++){
			dt[0].children.push({text:(pageInfo.datasource[i].use=='jdbc'?pageInfo.datasource[i].dsname:pageInfo.datasource[i].jndiname),id:pageInfo.datasource[i].dsid,iconCls:"icon-dsource",attributes:{showmenu:true,type:'dsource'}});
		}
	}
	if(pageInfo.dataset){
		dt[1].children = [];
		for(var i=0; i<pageInfo.dataset.length; i++){
			var obj = {text:pageInfo.dataset[i].name,id:pageInfo.dataset[i].datasetid,iconCls:"icon-dataset2",attributes:{showmenu:true,type:'dset'}, children:[],state:"open"};
			dt[1].children.push(obj);
			var o = pageInfo.dataset[i].cols;
			if(o && o[0] != null){
				obj.children = initdatasetview(o, pageInfo.dataset[i].datasetid);
			}
		}
	}
	if(pageInfo.cube){
		dt[2].children = [];
		for(var i=0; i<pageInfo.cube.length; i++){
			var cb = pageInfo.cube[i];
			var obj = {text:cb.name,id:cb.id, iconCls:'icon-cube', attributes:{showmenu:true,type:'cube'}, children:[],state:"open"};
			dt[2].children.push(obj);
			var o = cb.dim;
			if(o){
				for(var j=0; j<o.length; j++){
					if(o[j].tp == 'dim'){
						obj.children.push({text:o[j].name,id:o[j].id,iconCls:'icon-dim',attributes:{showmenu:true,drag:'n',type:'dim',cubeId:cb.id}});
					}else if(o[j].tp == 'group'){
						var t = {text:o[j].name,id:o[j].id,iconCls:'icon-group',children:[],attributes:{showmenu:true,drag:'n',type:'group', cubeId:cb.id}};
						obj.children.push(t);
						for(var k=0; k<o[j].children.length; k++){
							var tt = o[j].children[k];
							t.children.push({text:tt.name,id:tt.id,iconCls:'icon-dim',attributes:{showmenu:true,drag:'n',type:'dim',cubeId:cb.id}});
						}
					}
				}
			}
			var k = cb.kpi;
			if(k){
				for(var j=0; j<k.length; j++){
					obj.children.push({text:k[j].aggre+'('+k[j].name+')',id:k[j].id,iconCls:(k[j].calc?'icon-ckpi':'icon-kpi'),attributes:{showmenu:true,drag:'n',type:'kpi',cubeId:cb.id}});
				}
			}
		}
	}
	$("#mydatatree").tree({
		data:dt,
		dnd:false,
		/**
		onBeforeDrag:function(target){
			if(target.attributes && target.attributes.drag == 'y'){
				return true;
			}
			return false;
		},
		onDragEnter:function(target, source){
			return false;
		},
		**/
		onContextMenu: function(e, node){
			if(node.attributes && node.attributes.showmenu == true ){
				e.preventDefault();
				curTmpInfo.tp = node.attributes.type;
				curTmpInfo.id = node.id;
				if(node.attributes.onlyAdd){
					$("#mydatasetmenu").menu("disableItem", $("#dataset_mod"));
					$("#mydatasetmenu").menu("disableItem", $("#dataset_del"));
					$("#mydatasetmenu").menu("enableItem", $("#dataset_add"));
				}else{
					$("#mydatasetmenu").menu("enableItem", $("#dataset_mod"));
					$("#mydatasetmenu").menu("enableItem", $("#dataset_del"));
					$("#mydatasetmenu").menu("disableItem", $("#dataset_add"));
				}
				$('#mydatatree').tree('select', node.target);
				$('#mydatasetmenu').menu('show', {
					left: e.pageX,
					top: e.pageY
				});
			}else{
				e.preventDefault();
			}
		}
	});
}
function newdatactx(){
	var id = curTmpInfo.id;
	if(id == "sjy"){
		newdatasource(false);
	}else if(id == "sjj"){
		newdataset();
	}else if(id == 'lft'){
		newcube();
	}
}
function editmydata(){
	var tp = curTmpInfo.tp;
	var id = curTmpInfo.id;
	if(tp == 'dsource'){
		newdatasource(true);
	}else if(tp == 'dset'){
		editdataset();
	}else if(tp == 'dsetTable'){
	    	var node = $("#mydatatree").tree("getSelected");
	    	editdataset(node.attributes.datasetid);
	}else if(tp == 'cube'){
		newcube(true, id);
	}else if(tp == 'dsetcol'){
		var node = $("#mydatatree").tree("getSelected");
		editDsColumn(node.id, node.attributes.datasetid, node.attributes.tname, 'col');
	}else if(tp == 'kpi' || tp == 'dim' || tp == 'group'){
		var node = $("#mydatatree").tree("getSelected");
		editcubecol2(tp, id, node);
	}
}
function deletemydata(){
    	var tp = curTmpInfo.tp;
	var id = curTmpInfo.id;
    	if(tp == 'dsetTable'){
	    //var node = $("#mydatatree").tree("getSelected");
	    msginfo("请直接在要删除的数据集上右键删除数据集。");
	    return;
	}
	if(confirm("是否确认删除？") == false){
		return;
	}
	if(tp == 'dsource'){
		var node = $("#mydatatree").tree("getSelected");
		$("#mydatatree").tree("remove", node.target);
		//从JSON中移除
		var idx = -1;
		for(i=0;i<pageInfo.datasource.length;i++){
			if(pageInfo.datasource[i].dsid == id){
				idx = i;
				break;
			}
		}
		pageInfo.datasource.splice(idx, 1);
		
	}
	if(tp == 'dset'){
		var node = $("#mydatatree").tree("getSelected");
		$("#mydatatree").tree("remove", node.target);
		var idx = -1;
		for(i=0;i<pageInfo.dataset.length;i++){
			if(pageInfo.dataset[i].datasetid == id){
				idx = i;
				break;
			}
		}
		pageInfo.dataset.splice(idx, 1);
	}
	if(tp == 'dsetcol'){
		var node = $("#mydatatree").tree("getSelected");
		var dset = findDatasetById(node.attributes.datasetid);
		//判断该字段是否存在表关联，如果存在，不能删除字段
		var isJoin = function(col, tname){
			var ret = null;
			for(j=0; dset.joininfo && j<dset.joininfo.length; j++){
				//是主表，字段相同
				if( dset.master==tname && dset.joininfo[j].col == col){
					ret = dset.joininfo[j];
					break;
				}else
				if(tname == dset.joininfo[j].ref && col == dset.joininfo[j].refKey ){
					ret =  dset.joininfo[j];
					break;
				}
			}
			return ret;
		}
		if(isJoin(node.id, node.attributes.tname) != null){
			msginfo("当前字段是表关联字段，不允许删除！");
			return;
		}
		var tname = node.attributes.tname;
		var idx = -1;
		for(i=0; i<dset.cols.length; i++){
			if(dset.cols[i].tname == tname && dset.cols[i].name == node.id){
				idx = i;
				break;
			}
		}
		dset.cols.splice(idx, 1);
		$("#mydatatree").tree("remove", node.target);
	}
	if(tp == 'cube'){
		var node = $("#mydatatree").tree("getSelected");
		$("#mydatatree").tree("remove", node.target);
		var idx = -1;
		for(i=0;i<pageInfo.cube.length;i++){
			if(pageInfo.cube[i].id == id){
				idx = i;
				break;
			}
		}
		pageInfo.cube.splice(idx, 1);
		initselectDataTree(); //更新指标选择树
	}
	if(tp == 'dim'){
		var node = $("#mydatatree").tree("getSelected");
		var cube = fundCubeById(node.attributes.cubeId);
		//获取上级
		var parent = $("#mydatatree").tree("getParent", node.target);
		if(parent.attributes.type == 'cube'){ //上级是cube,直接删除
			var idx = -1;
			for(var i=0; i<cube.dim.length; i++){
				var d = cube.dim[i];
				if(d.tp == 'dim' && d.id == node.id){
					idx = i;
					break;
				}
			}
			cube.dim.splice(idx, 1);
		}else{
			//上级是分组
			//先找到分组
			var group = null;
			for(var i=0; i<cube.dim.length; i++){
				var d = cube.dim[i];
				if(d.tp == 'group' && d.id == parent.id){
					group = d;
					break;
				}
			}
			//再找维度
			var idx = -1;
			for(j=0; j<group.children.length; j++){
				var g = group.children[j];
				if(g.id == node.id){
					idx = j;
					break;
				}
			}
			group.children.splice(idx, 1);
		}
		initselectDataTree(); //更新指标选择树
		$("#mydatatree").tree("remove", node.target);
	}
	if(tp == 'kpi'){
		//从json里删除数据
		var node = $("#mydatatree").tree("getSelected");
		var cube = fundCubeById(node.attributes.cubeId);
		var idx = findCubeKpiById(cube, node.id, true);
		cube.kpi.splice(idx, 1);
		$("#mydatatree").tree("remove", node.target);
		initselectDataTree(); //更新指标选择树
	}
	if(tp == 'group'){
		var node = $("#mydatatree").tree("getSelected");
		var cube = fundCubeById(node.attributes.cubeId);
		var group = findCubeGroupById(cube, node.id);
		if(group.children && group.children.length > 0){
			msginfo("分组下级包含维度，不能删除。");
			return;
		}
		var idx = findCubeGroupById(cube, node.id, true);
		cube.dim.splice(idx, 1);
		$("#mydatatree").tree("remove", node.target);
		initselectDataTree(); //更新指标选择树
	}
	curTmpInfo.isupdate = true;
}
function newdataset(){
	if(!pageInfo.datasource){
		msginfo("创建数据集前，请先创建数据源！");
		return;
	}
	var sel = "<select id=\"dsid\" name=\"dsid\" class=\"inputform\">";
	for(var i=0; pageInfo.datasource && i<pageInfo.datasource.length; i++){
		sel = sel + "<option value=\""+pageInfo.datasource[i].dsid+"\">"+(pageInfo.datasource[i].use=='jdbc'?pageInfo.datasource[i].dsname:pageInfo.datasource[i].jndiname)+"</option>";
	}
	sel = sel + "</select>";
	var ctx = "<div id=\"crtdataset\" class=\"easyui-tabs\" data-options=\"fit:true,border:false,tabPosition:'left'\"><div title=\"基本信息\"><div class=\"textpanel\"><span class=\"inputtext\">数据集名称：</span><input type=\"text\" id=\"datasetname\" name=\"datasetname\" class=\"inputform\"><br/><span class=\"inputtext\">连接数据源：</span>"+sel+"<br/><span class=\"inputtext\" style=\"width:120px;\">选择需要分析的表：</span><br/><div class=\"tablesleft\"><div class=\"tabletitle\">待选表</div><ul id=\"allTablesTree\" style=\"height:220px; width:100%; overflow:auto\"></ul></div><div class=\"tablescenter\"><input id=\"left2right\" type=\"button\" style=\"margin-top:120px;\" value=\">\" title=\"选择\"><br/><input type=\"button\" id=\"right2left\"  value=\"<\" title=\"移除\"></div><div class=\"tablesright\"><div class=\"tabletitle\">已选表</div><ul id=\"selTablesTree\" class=\"easyui-tree\" style=\"height:220px; width:100%; overflow:auto\"></ul></div></div></div><div title=\"表关联\"><div class=\"textpanel\"><div style=\"float:right\"><input type=\"button\" id=\"jointable\" value=\"关联\"> <br/> <input type=\"button\" id=\"unjointable\" value=\"取消\"></div><span class=\"inputtext\">主表： </span><select id=\"mastertable\" style=\"width:300px;\"></select><br/><ul class=\"easyui-tree\" id=\"masterTableTree\" style=\"margin-left:90px;border:1px solid #999; width:300px; height:320px; overflow:auto\"></ul></div></div></div>";
	$('#pdailog').dialog({
		title: '创建数据集',
		width: 680,
		height: 450,
		closed: false,
		cache: false,
		modal: true,
		toolbar:null,
		onLoad:function(){
		},
		content: ctx,
		buttons:[{
				text:'确定',
				handler:function(){
					var name = $("#pdailog #datasetname").val();
					var dsid = $("#pdailog #dsid").val();
					
					if(name == ''){
						msginfo("请填写数据集名称。");
						$("#crtdataset").tabs("select", 0)
						$("#datasetname").focus();
						return;
					}
					var cld = $("#selTablesTree").tree("getChildren");
					if(cld == null || cld.length == 0){
						msginfo("您还未选择目标表。");
						return;
					}
					
					if(!pageInfo.dataset){
						pageInfo.dataset = [];
					}
					var dsobj = findDatasourceById(dsid);
					
					var obj = {"name":name,"dsid":dsid, "datasetid":newGuid()};
					//构建表连接信息
					obj.master = $("#mastertable").val();
					var ls = $("#masterTableTree").tree("getChildren");
					var joininfo = [];
					for(i=0; i<ls.length; i++){
						var child = ls[i];
						if(child.iconCls == 'icon-coljoin'){
							joininfo.push({col:child.id,  ref:child.attributes.ref, refKey:child.attributes.refKey,jtype:child.attributes.jtype,force:child.attributes.force});
						}
					}
					obj.joininfo = joininfo;
					pageInfo.dataset.push(obj);
					var ds = findDatasourceById(dsid);
					//添加节点
					$.ajax({
						type:'post',
						async: false,
						url:'DataSet!queryDatasetMeta.action',
						dataType:'json',
						data:{"ds":JSON.stringify(ds), "dataset":JSON.stringify(obj)},
						success: function(dt){
							obj.cols = dt;
							var ndt = {id:obj.datasetid, text:obj.name, iconCls:'icon-dataset2', attributes:{drag:'n', showmenu:true,type:'dset'}};
							var ret = initdatasetview(dt, obj.datasetid);
							ndt.children = ret;
							$("#mydatatree").tree("append", {parent:$("#mydatatree div[node-id='sjj']"), data:ndt});
						}
					});
					$("#l_tab").tabs("select", 1);
					curTmpInfo.isupdate = true;
					$('#pdailog').dialog('close');
				}
			},{
				text:'取消',
				handler:function(){
					$('#pdailog').dialog('close');
				}
			}]
	});
	var initTablesFunc = function(dsid){
		var ds = findDatasourceById(dsid);
		//加载表列表树
		$.ajax({
			type:'post',
			url:'DataSet!queryTables.action',
			dataType:'json',
			data:{"ds":JSON.stringify(ds)},
			success: function(dt){
				$("#allTablesTree").tree({
					data: dt
				});
			}
		});
	}
	//数据源切换事件
	$("#pdailog #dsid").bind("change", function(){
		//清空已选表
		var ls = $("#selTablesTree").tree("getChildren");
		for(i=0; i<ls.length; i++){
			$("#selTablesTree").tree("remove", ls[i].target);
		}
		$("#mastertable").html("");
		initTablesFunc($(this).val());
	});
	initTablesFunc($("#pdailog #dsid").val());
	
	//绑定选择事件
	$("#pdailog #left2right").bind("click", function(){
		var node = $("#allTablesTree").tree("getSelected");
		if(node == null || $(node.target).attr("hide") == 'y'){
			msginfo("请先从左边选择表。");
			return
		}
		$("#selTablesTree").tree("append", {parent:null, data:[{id:node.id, text:node.text, iconCls:node.iconCls}]});
		$(node.target).attr("hide", "y").hide();
		//更新主表select的数据
		var sel = document.getElementById("mastertable");
		var sidx = sel.selectedIndex;
		sel.options.add(new Option(node.id, node.text));
		if(sidx == -1){  //说明是从无到有，更新表字段
			updateColsFunc(node.id);
		}
	});
	$("#pdailog #right2left").bind("click", function(){
		var node = $("#selTablesTree").tree("getSelected");
		if(node == null){
			msginfo("您还未选择需要移除的表。");
			return
		}
		var cld = $("#allTablesTree").tree("getChildren");
		for(i=0; i<cld.length; i++){
			if(cld[i].id == node.id){
				$(cld[i].target).attr("hide", "n").show();
				break;
			}
		}
		$("#selTablesTree").tree("remove", node.target);
		var sel = document.getElementById("mastertable");
		var sidx = sel.selectedIndex;
		var idx = 0;
		for(i=0; i<sel.options.length; i++){
			if(sel.options[i].value == node.id){
				idx = i;
				break;
			}
		}
		sel.options.remove(idx);
		if(sidx == idx){ //如果删除那个字段刚好是选择的字段，更新表字段
			updateColsFunc(sel.options[sel.selectedIndex].value);
		}
	});
	var updateColsFunc = function(tname){
		$.ajax({
			type:'post',
			url:'DataSet!queryMeta.action',
			dataType:'json',
			data:{"ds":JSON.stringify(findDatasourceById($("#crtdataset #dsid").val())), "querysql":"select * from " + tname + " where 1=2"},
			success: function(dt){
				var d = [];
				for(k=0; k<dt.length; k++){
					d.push({id:dt[k].name, text:dt[k].name, iconCls:"icon-dscol", attributes:{}});
				}
				$("#masterTableTree").tree({
					data: d,
					onDblClick:function(node){
						jointableFunc();
					}
				});
			}
		});
	}
	$("#mastertable").bind("change", function(){
		updateColsFunc($(this).val());
	});
	//绑定表关联、取消关联事件
	$("#pdailog #jointable").bind("click", function(){
		jointableFunc();
	});
	$("#unjointable").bind("click", function(){
		var node = $("#masterTableTree").tree("getSelected");
		if(node == null){
			msginfo("您还未从主表字段中选择需要删除关联的字段。");
			return;
		}
		delete node.attributes.ref;
		delete node.attributes.refKey;
		$("#masterTableTree").tree("update", {target:node.target, text:node.id, iconCls:"icon-dscol"});
	});
}
//初始化数据集视图（表 + 字段）
function initdatasetview(dt, datasetid){
	var rett = [];
	//查询表列表
	var tabls = [];
	var existtab = function(tname){
		var ret = false;
		for(k=0; k<tabls.length; k++){
			if(tabls[k] == tname){
				ret = true;
				break;
			}
		}
		return ret;
	}
	var findtabcols = function(tname){
		var ret = [];
		for(k=0; k<dt.length; k++){
			if(dt[k].tname == tname){
				ret.push(dt[k]);
			}
		}
		return ret;
	}
	for(j=0; j<dt.length; j++){
		if(!existtab(dt[j].tname)){
			tabls.push(dt[j].tname);
		}
	}
	for(j=0; j<tabls.length; j++){
		var tn = tabls[j];
		var colls = findtabcols(tabls[j]);
		var child = [];
		rett.push({id:tn, text:tn, iconCls:'icon-table',state:'closed',attributes:{showmenu:true, type:'dsetTable',datasetid:datasetid},children:child});
		for(k=0; k<colls.length; k++){
			var o = colls[k];
			child.push({id:o.name, text:o.name, iconCls:'icon-dscol', attributes:{showmenu:true,drag:'n',vtype:o.type,tname:o.tname,datasetid:datasetid, type:'dsetcol'}});
		}
	}
	return rett;
}
function jointableFunc(){
	var node = $("#masterTableTree").tree("getSelected");
	if(node == null){
		msginfo("您还未从主表字段中选择需要关联的字段。");
		return;
	}
	//建立关联
	if($("#dsColumn_div").size() == 0){
		$("<div id=\"dsColumn_div\"></div>").appendTo("body");
	}
	var tbs = "";
	var tname = null;
	var cld = $("#selTablesTree").tree("getChildren");
	for(i=0; i<cld.length; i++){
		if(cld[i].id != $("#mastertable").val()){
			tbs = tbs + "<option value=\""+cld[i].id+"\">"+cld[i].text+"</option>";
			if(tname == null){
				tname = cld[i].id;
			}
		}
	}
	var getSlaveColumns = function(tn){
		var slavecols = "";
		//获取选取从表的表字段
		if(tname != null){
			$.ajax({
				type:'post',
				async:false,
				url:'DataSet!queryMeta.action',
				dataType:'json',
				data:{"ds":JSON.stringify(findDatasourceById($("#crtdataset #dsid").val())), "querysql":"select * from " + tn + " where 1=2"},
				success: function(dt){
					for(k=0; k<dt.length; k++){
						slavecols = slavecols + "<option value=\""+ dt[k].name+"\">" + dt[k].name + "</option>";
					}
				}
			});
		}
		return slavecols;
	};
	
	var ctx = "<div class=\"textpanel\">主表 <b>"+$("#mastertable").val()+"</b> 字段 <b>"+node.id+"</b> <br/> &nbsp; &nbsp; &nbsp; =>关联到=> <br/> 从表 <select id=\"slavetable\" style=\"width:150px;\">"+tbs+"</select> 字段 <select id=\"slavetablecol\"  style=\"width:100px;\">"+getSlaveColumns(tname)+"</select> <br/>连接类型：<select id=\"jtype\" style=\"width:110px;\"><option value=\"all\">全连接</option><option value=\"left\">左连接</option><option value=\"right\">右连接</option></select><br/>强制连接：<input type=\"checkbox\" id=\"force\" name=\"force\" value=\"1\"> <span style='color:#ccc'>(勾选后，每次查询都会关联此表)</span></div>";
	$('#dsColumn_div').dialog({
		title: "关联维度表",
		width: 360,
		height: 250,
		closed: false,
		cache: false,
		modal: true,
		toolbar:null,
		content:ctx,
		onLoad:function(){},
		onClose:function(){
			$('#dsColumn_div').dialog('destroy');
		},
		buttons:[{
				text:'确定',
				handler:function(){
					//建立关联关系
					node.attributes.ref = $("#dsColumn_div #slavetable").val();
					node.attributes.refKey = $("#dsColumn_div #slavetablecol").val();
					var jtype = $("#dsColumn_div #jtype").val();
					var force = $("input[name='force']:checkbox:checked").val();
					node.attributes.jtype = jtype;
					node.attributes.force = force?"y":"n";
					$("#masterTableTree").tree("update", {target:node.target, text:node.text + " -> " + node.attributes.ref + "." + node.attributes.refKey, iconCls:"icon-coljoin"});
					$('#dsColumn_div').dialog('close');
				}
			},{
				text:'取消',
				handler:function(){
					$('#dsColumn_div').dialog('close');
				}
			}]
	});
	$("#slavetable").bind("change", function(){
		var s = getSlaveColumns($(this).val());
		$("#slavetablecol").html(s);
	});
}
function editdataset(dset_id){
	var id = dset_id ? dset_id : curTmpInfo.id;
	var dset = findDatasetById(id);
	//复制一份dset用来编辑
	dset = eval("("+JSON.stringify(dset)+")");
	curTmpInfo.curDset = dset;
	var dsource = findDatasourceById(dset.dsid);
	$('#pdailog').dialog({
		title: '编辑数据集',
		width: 800,
		height: 470,
		closed: false,
		cache: false,
		modal: true,
		toolbar:null,
		content:'<div id="datasettabs" ><div title="基本信息" ><div class="textpanel"><span class="inputtext">数据集名称：</span><input type="text" class="inputform" name="datasetname" id="datasetname" value="'+dset.name+'"><br/><span class="inputtext">连接数据源：</span><input type="text" class="inputform" value="'+(dsource.use=='jndi'?dsource.jndiname:dsource.dsname)+'" readOnly=true>(不能更改)<br/><span class="inputtext">已选分析表：</span><br/><table width="100%" border="0" cellspacing="0" cellpadding="0"><tr><td width="70%" valign="top"><ul id=\"selectTables\"></ul></td><td valign="top" align="right"><a id=\"addtable\" href=\"#\">添加表</a><br/><a id=\"deltable\" href=\"#\">删除表</a></td></tr></table></div></div><div title="表关联" ><div class="textpanel"><div style="float:right"><input type="button" value="关联" id="jointable"><br/><input type="button" value="删除" id="deljointable"></div><span class="inputtext">主表： </span><input type="text" class="inputform" value="'+dset.master+'" style="width:300px;"><input type="button" id="reloadcols" value="刷新字段"><br/><ul id="masterTableTree" style="margin-left:90px;border:1px solid #999; width:300px; height:320px; overflow:auto"></ul></div></div><div title="字段信息"></div><div title="动态字段"></div><div title="数据筛选"></div><div title="数据预览"></div></div>',
		onLoad:function(){
		},
		buttons:[{
				text:'确定',
				handler:function(){
					//dset.dsid = $("#dsid").val();
					dset.name = $("#datasetname").val();
					if(dset.name == ''){
						msginfo("请填数据集名称。");
						$("#datasetname").focus();
						return;
					}
					//判断有没有添加了表，但是未关联的
					for(i=0; i<dset.joininfo.length; i++){
						var o = dset.joininfo[i];
						if(o.col == ""){
							msginfo("表 "+o.ref+" 还未和主表关联。");
							return;
						}
					}
					//把dset回写回去
					for(var i=0; i<pageInfo.dataset.length; i++){
						var d = pageInfo.dataset[i];
						if(d.datasetid == dset.datasetid){
							pageInfo.dataset[i] = dset;
							break;
						}
					}
					//更新数据集
					var pp = $('#mydatatree').tree('getSelected');
					var ls = $("#mydatatree").tree("getChildren", pp.target);
					for(var i=0; i<ls.length; i++){
						$("#mydatatree").tree("remove", ls[i].target);
					}
					//添加更新后的列字段
					var ncols = [];
					for(var j=0; j<dset.cols.length; j++){
						var o = dset.cols;
						ncols = initdatasetview(o, dset.datasetid);
					}
					$("#mydatatree").tree("append", {parent:pp.target, data: ncols});
					$("#mydatatree").tree("update", {target:pp.target, text: dset.name});
					
					curTmpInfo.isupdate = true;
					delete curTmpInfo.curDset;
					$('#pdailog').dialog('close');
				}
			},{
				text:'取消',
				handler:function(){
					delete curTmpInfo.curDset;
					$('#pdailog').dialog('close');
				}
			}]
	});
	//加载已选择表
	var stbs = [];
	stbs.push({id:dset.master,text:dset.master+' (主表)',iconCls:'icon-table'});
	for(i=0; dset.joininfo && i<dset.joininfo.length; i++){
		stbs.push({id:dset.joininfo[i].ref,text:dset.joininfo[i].ref,iconCls:'icon-table'});
	}
	$("#selectTables").tree({
		data: stbs
	});
	//注册添加表事件
	$("#pdailog #addtable").linkbutton({"iconCls":"icon-add","plain":true}).bind("click", function(){
		if($("#dsColumn_div").size() == 0){
			$("<div id=\"dsColumn_div\" class=\"easyui-menu\"></div>").appendTo("body");
		}
		var ds = findDatasourceById(dset.dsid);
		var ctx = "<ul id=\"selectTablesTree\"></ul>";
		$('#dsColumn_div').dialog({
			title: '添加表',
			width: 350,
			height: 280,
			closed: false,
			cache: false,
			modal: true,
			toolbar:null,
			content:ctx,
			onLoad:function(){},
			onClose:function(){
				$('#dsColumn_div').dialog('destroy');
			},
			buttons:[{
					text:'确定',
					handler:function(){
						var nd = $("#dsColumn_div #selectTablesTree").tree("getSelected");
						if(nd == null){
							msginfo("请选择表。");
							return;
						}
						var tname = nd.id;
						//判断选择表是否已经存在
						if(tname == dset.master){
							msginfo("您选择的表已经存在。");
							return;
						}
						var exist = false;
						for(i=0; dset.joininfo&&i<dset.joininfo.length; i++){
							if(dset.joininfo[i].ref == tname){
								exist = true;
								break;
							}
						}
						if(exist){
							msginfo("您选择的表已经存在。");
							return;
						}
						//给dset添加关联表
						dset.joininfo.push({col:"",ref:tname,refKey:""});
						//给节点添加表
						$("#pdailog #selectTables").tree("append", {parent:null, data:{id:tname, text:tname, iconCls:'icon-table'}});
						//添加表的列到 cols
						$.ajax({
							type:'post',
							async:false,
							url:'DataSet!queryMeta.action',
							dataType:'json',
							data:{"ds":JSON.stringify(findDatasourceById(dset.dsid)), "querysql":"select * from " + tname + " where 1=2"},
							success: function(dt){
								for(k=0; k<dt.length; k++){
									dt[k].tname = tname;
									dset.cols.push(dt[k]);
								}
							}
						});
						curTmpInfo.isupdate = true;
						$('#dsColumn_div').dialog('close');
					}
				},{
					text:'取消',
					handler:function(){
						$('#dsColumn_div').dialog('close');
					}
				}]
		});
		//加载表列表树
		$.ajax({
			type:'post',
			url:'DataSet!queryTables.action',
			dataType:'json',
			data:{"ds":JSON.stringify(ds)},
			success: function(dt){
				$("#selectTablesTree").tree({
					data: dt
				});
			}
		});
	});
	//注册删除表事件
	$("#pdailog #deltable").linkbutton({"iconCls":"icon-edit","plain":true}).bind("click", function(){
		var node = $("#pdailog #selectTables").tree("getSelected");
		if(node == null){
			msginfo("请选择表。");
			return;
		}
		var tname = node.id;
		if(tname == dset.master){
			msginfo("不能删除主表");
			return;
		}
		//判断立方体中是否使用了此表
		var cubes = pageInfo.cube;
		var use = false;
		for(i=0; cubes&&i<cubes.length; i++){
			var cube = cubes[i];
			if(cube.datasetid != dset.datasetid){
				continue;
			}
			for(j=0; j<cube.dim.length; j++){
				var d = cube.dim[j];
				if(d.tp == "group"){
					var ls = d.children;
					for(k=0; k<ls.length; k++){
						if(ls[k].tname == tname || ls[k].codetable == tname){
							use = true;
							break;
						}
					}
				}else{
					if(d.tname == tname || d.codetable == tname){
						use = true;
						break;
					}
				}
			}
		}
		if(use){
			msginfo("您要删除的表已在立方体中使用，不能删除.");
			return;
		}
		if(confirm("是否确认删除？")){
			//删除表
			var idx = -1;
			for(i=0; dset.joininfo&&i<dset.joininfo.length; i++){
				if(dset.joininfo[i].ref == tname){
					idx = i;
				}
			}
			if(dset.joininfo){
				dset.joininfo.splice(idx, 1);
			}
			//删除表字段
			var ncols = [];
			for(i=0; i<dset.cols.length; i++){
				var c = dset.cols[i];
				if(c.tname != tname){
					ncols.push(c);
				}
			}
			dset.cols = ncols;
			//删除节点
			 $("#pdailog #selectTables").tree("remove", node.target);
		}
	});
	//表关联 -- 取消关联按钮
	$("#pdailog #deljointable").click(function(){
		var node = $("#masterTableTree").tree("getSelected");
		var joininfo = null;
		for(i=0; i<dset.joininfo.length; i++){
			if(dset.joininfo[i].ref == node.attributes.ref){
				joininfo = dset.joininfo[i];
				break;
			}
		}
		if(joininfo != null){
			joininfo.col = "";
			joininfo.refKey = "";
			$("#masterTableTree").tree("update", {target:node.target, text: node.id, iconCls:"icon-dscol"});
		};
	});
	$("#pdailog #reloadcols").click(function(){ //按钮，刷新字段
		showloading();
		$.ajax({
			type:'post',
			url:'DataSet!queryDatasetMeta.action',
			dataType:'json',
			data:{"ds":JSON.stringify(findDatasourceById(dset.dsid)), "dataset":JSON.stringify(dset)},
			success: function(dt){
				hideLoading();
				dset.cols = dt;
				loadMasterCols();
			},
			error:function(resp){
				hideLoading();
			}
		});
	});
	//表关联 -- 关联按钮
	$("#pdailog #jointable").click(function(){
		var node = $("#masterTableTree").tree("getSelected");
		if(node == null){
			msginfo("您还未从主表字段中选择需要关联的字段。");
			return;
		}
		//建立关联
		if($("#dsColumn_div").size() == 0){
			$("<div id=\"dsColumn_div\"></div>").appendTo("body");
		}
		var tbs = "";
		var tname = null;
		var cld = dset.joininfo;
		for(i=0; i<cld.length; i++){
			if(cld[i].col == '' || cld[i].col == node.id){  //只关联新添加的表 和 自己
				tbs = tbs + "<option value=\""+cld[i].ref+"\" "+(cld[i].col == node.id?"selected":"")+">"+cld[i].ref+"</option>";
			}
		}
		var jinfo = null;
		for(i=0; i<dset.joininfo.length; i++){
			if(dset.joininfo[i].col == node.id){
				jinfo = dset.joininfo[i];
				break;
			}
		}
		var getSlaveColumns = function(tn){
			if(!tn || tn == null){
				return "";
			}
			var slavecols = "";
			//获取选取从表的表字段
			$.ajax({
				type:'post',
				async:false,
				url:'DataSet!queryMeta.action',
				dataType:'json',
				data:{"ds":JSON.stringify(findDatasourceById(dset.dsid)), "querysql":"select * from " + tn + " where 1=2"},
				success: function(dt){
					for(k=0; k<dt.length; k++){
						slavecols = slavecols + "<option value=\""+ dt[k].name+"\" "+(jinfo!=null&&jinfo.refKey==dt[k].name?"selected":"")+">" + dt[k].name + "</option>";
					}
				}
			});
			return slavecols;
		};
		var ctx = "<div class=\"textpanel\">主表 <b>"+dset.master+"</b> 字段 <b>"+node.id+"</b> <br/> &nbsp; &nbsp; &nbsp; =>关联到=> <br/> 从表 <select id=\"slavetable\" style=\"width:150px;\">"+tbs+"</select> 字段 <select id=\"slavetablecol\"  style=\"width:100px;\"></select><br/>连接类型：<select id=\"jtype\" style=\"width:110px;\"><option value=\"all\" "+(jinfo!=null&&jinfo.jtype=="all"?"selected":"")+">全连接</option><option value=\"left\" "+(jinfo!=null&&jinfo.jtype=="left"?"selected":"")+">左连接</option><option value=\"right\" "+(jinfo!=null&&jinfo.jtype=="right"?"selected":"")+">右连接</option></select><br/>强制连接：<input type=\"checkbox\" id=\"force\" name=\"force\" value=\"1\" "+(jinfo!=null&&jinfo.force=="y"?"checked":"")+"> <span style='color:#ccc'>(勾选后，每次查询都会关联此表)</span></div>";
		$('#dsColumn_div').dialog({
			title: "关联维度表",
			width: 360,
			height: 250,
			closed: false,
			cache: false,
			modal: true,
			toolbar:null,
			content:ctx,
			onLoad:function(){},
			onClose:function(){
				$('#dsColumn_div').dialog('destroy');
			},
			buttons:[{
					text:'确定',
					handler:function(){
						//建立关联关系
						var ref = $("#dsColumn_div #slavetable").val();  //关联表 
						var refkey = $("#dsColumn_div #slavetablecol").val(); //关联字段
						var jtype = $("#dsColumn_div #jtype").val();
						var force = $("input[name='force']:checkbox:checked").val();
						if(!ref || ref == null || ref == ""){
							msginfo("请选择关联表。");
							return;
						}
						if(jinfo == null){
							for(i=0; i<dset.joininfo.length; i++){
								if(dset.joininfo[i].ref == ref){
									jinfo = dset.joininfo[i];
									break;
								}
							}
						}
						jinfo.col = node.id;
						jinfo.refKey = refkey;
						jinfo.jtype = jtype;
						jinfo.force = force?"y":"n";
						$("#masterTableTree").tree("update", {target:node.target, text:node.id + " -> " + ref + "." + refkey, iconCls:"icon-coljoin"});
						$('#dsColumn_div').dialog('close');
					}
				},{
					text:'取消',
					handler:function(){
						$('#dsColumn_div').dialog('close');
					}
				}]
		});
		$("#slavetable").bind("change", function(){
			var s = getSlaveColumns($(this).val());
			$("#slavetablecol").html(s);
		});
		var s = getSlaveColumns($("#slavetable").val());
		$("#slavetablecol").html(s);
	});
	/**
	加载表字段
	**/
	var loadMasterCols = function(){
		//加载表关联
		var isJoin = function(col){
			var ret = null;
			for(j=0; dset.joininfo && j<dset.joininfo.length; j++){
				if(dset.joininfo[j].col == col){
					ret = dset.joininfo[j];
					break;
				}
			}
			return ret;
		}
		var mcols = [];
		for(i=0; i<dset.cols.length; i++){
			if(dset.cols[i].tname == dset.master){
				var r = isJoin(dset.cols[i].name);
				if(r == null){
					mcols.push({id:dset.cols[i].name,text:dset.cols[i].name, iconCls:'icon-dscol', attributes:{ref:""}});
				}else{
					mcols.push({id:dset.cols[i].name,text:dset.cols[i].name+" -> "+r.ref + '.' + r.refKey , iconCls:'icon-coljoin', attributes:{ref:r.ref}});
				}
			}
		}
		$("#masterTableTree").tree({
			data:mcols
		});
	};
	
	$("#datasettabs").tabs({border:false,fit:true,tabPosition:"left","plain":false, onLoad:function(){
	},
	onSelect:function(a, b){
		if(b == 1){
			loadMasterCols();
		}
		if(b == 2){
			var pp = $('#datasettabs').tabs('getSelected');
			var str = "<table class=\"grid3\" id=\"T_report54\" cellpadding=\"0\" cellspacing=\"0\">";
			str = str + "<tr><th width='20%'>字段名</th><th width='17%'>显示名</th><th width='17%'>类型</th><th width='30%'>来源表</th><th width='15%'>操作</th></tr>";
			for(var i=0; i<dset.cols.length; i++){
				m = dset.cols[i];
				str = str + "<tr><td class='kpiData1 grid3-td'>"+m.name+"</td><td class='kpiData1 grid3-td'><div id=\""+m.tname+"_"+m.name+"_disp\">"+(m.dispName == '' ? "&nbsp;":m.dispName)+"</div></td><td class='kpiData1 grid3-td'><div id=\""+m.tname+"_"+m.name+"_tp\">"+m.type+"</div></td><td class='kpiData1 grid3-td'>"+m.tname+"</td><td class='kpiData1 grid3-td'><a href=\"javascript:;\" onclick=\"editDsColumn('"+m.name+"', null, '"+m.tname+"', 'panel')\">编辑</a></td></tr>";
			}
			str = str + "</table>";
			$(pp).html(str);
		}
		if(b == 3){
			reloadDynamicCol(dset);
		}
		if(b == 4){
			reloadDatasetFilter(dset);
		}
		if(b == 5){
			var pp = $('#datasettabs').tabs('getSelected');
			$(pp).html("加载中...");
			$(pp).load("DataSet!queryData.action", {"ds": JSON.stringify(dsource),"dataset":JSON.stringify(dset)}, function(a, b, c){
				if(b == 'error'){
					$(pp).html("SQL执行出错...");
				}
			});
		}
	}});
}
function reloadDatasetFilter(dataset){
	var str = "<a href=\"javascript:newdatasetparam(false);\" style=\"margin:3px;\" id=\"ndatasetparam\">新增</a><table class=\"grid3\" id=\"T_report54\" cellpadding=\"0\" cellspacing=\"0\">";
	str = str + "<tr><th>筛选字段</th><th>判断条件</th><th>筛选值</th><th>值类型</th><th>操作</th></tr>";
			
	for(var i=0; dataset.param&&i<dataset.param.length; i++){
		str = str + "<tr><td class=\"kpiData1 grid3-td\">"+dataset.param[i].col+"</td><td class=\"kpiData1 grid3-td\">"+dataset.param[i].type+"</td><td class=\"kpiData1 grid3-td\">"+(dataset.param[i].val+(dataset.param[i].val2 =='' ? "":"/"+dataset.param[i].val2))+"</td><td class=\"kpiData1 grid3-td\">"+dataset.param[i].valuetype+"</td><td class=\"kpiData1 grid3-td\"><a href=\"javascript:newdatasetparam(true,'"+dataset.param[i].id+"');\">编辑</a> <a href=\"javascript:delDatasetFilter('"+dataset.param[i].id+"');\">删除</a></td></tr>";
	}
	if(!dataset.param || dataset.param.length==0){
		str = str + "<tr><td class=\"kpiData1 grid3-td\" align=\"center\" colspan=\"5\">无数据.</td></tr>";
	}
	str = str + "</table>";
	
	var pp = $('#datasettabs').tabs('getSelected');
	$(pp).html(str);
	$("#datasettabs #ndatasetparam").linkbutton({iconCls:"icon-add"});
}
/**
动态字段
**/
function reloadDynamicCol(dataset){
	var str = "<a href=\"javascript:;\" style=\"margin:3px;\" id=\"dynamiccol\">新增</a><table class=\"grid3\" id=\"T_report54\" cellpadding=\"0\" cellspacing=\"0\">";
	str = str + "<tr><th width=\"15%\">字段名</th><th width=\"15%\">显示名</th><th width=\"40%\">表达式</th><th width=\"15%\">值类型</th><th width=\"15%\">操作</th></tr>";
			
	for(var i=0; dataset.dynamic && i<dataset.dynamic.length; i++){
		var o = dataset.dynamic[i];
		str = str + "<tr><td class=\"kpiData1 grid3-td\">"+o.name+"</td><td class=\"kpiData1 grid3-td\">"+o.dispName+"</td><td class=\"kpiData1 grid3-td\">"+o.expression.replace(/@/g,"'")+"</td><td class=\"kpiData1 grid3-td\">"+o.type+"</td><td class=\"kpiData1 grid3-td\"><a href=\"javascript:;\" col=\""+o.name+"\" id=\"dynamiccolupdate\">编辑</a> <a href=\"javascript:;\" col=\""+o.name+"\" id=\"dynamiccoldel\">删除</a></td></tr>";
	}
	if(!dataset.dynamic || dataset.dynamic.length==0){
		str = str + "<tr><td class=\"kpiData1 grid3-td\" align=\"center\" colspan=\"5\">无数据.</td></tr>";
	}
	str = str + "</table>";
	
	var pp = $('#datasettabs').tabs('getSelected');
	$(pp).html(str);
	var dynamicfunc = function(ccol){
	    var tps = "";
		for(var i=0; i<dataType.length; i++){
			tps = tps + "<option value=\""+dataType[i]+"\" "+( ccol && ccol.type == dataType[i] ? "selected" : "")+">"+dataType[i]+"</option>";
		}
		var ctx = "<div class=\"textpanel\"><span class=\"inputtext\">字段名：</span><input type=\"text\" id=\"colname\" name=\"colname\" class=\"inputform\" value=\""+(ccol?ccol.name:"")+"\">(添加后不能更改)<br/><span class=\"inputtext\">显示名：</span><input type=\"text\" id=\"dispname\" name=\"dispname\" class=\"inputform\" value=\""+(ccol?ccol.dispName:"")+"\"><br/><table cellspacing=\"0\" cellpadding=\"0\"><tbody><tr><td valign=\"top\"><span class=\"inputtext\">表 达 式：</span></td><td><textarea name=\"expression\" id=\"expression\" cols=\"40\" style=\"height:52px;\">"+(ccol?ccol.expression.replace(/@/g,"'"):"")+"</textarea></td></tr></tbody></table><span class=\"inputtext\">值类型：</span><select id=\"valtype\" class=\"inputform\">"+tps+"</select></div>";
		if($("#dsColumn_div").size() == 0){
			$("<div id=\"dsColumn_div\" class=\"easyui-menu\"></div>").appendTo("body");
		}
		$('#dsColumn_div').dialog({
			title: ccol ? '编辑动态字段' : '添加动态字段',
			width: 380,
			height: 260,
			closed: false,
			cache: false,
			modal: true,
			toolbar:null,
			content:ctx,
			onLoad:function(){},
			onClose:function(){
				$('#dsColumn_div').dialog('destroy');
			},
			buttons:[{
					text:'确定',
					handler:function(){
						if(ccol){
							ccol.dispName = $("#dsColumn_div #dispname").val();
							ccol.name = $("#dsColumn_div #colname").val();
							ccol.type = $("#dsColumn_div #valtype").val();
							ccol.expression = $("#dsColumn_div #expression").val().replace(/'/g,"@");
						}else{
							var obj = {dispName:$("#dsColumn_div #dispname").val(),name:$("#dsColumn_div #colname").val(),tname:dataset.master,type:$("#dsColumn_div #valtype").val(),expression:$("#dsColumn_div #expression").val().replace(/'/g,"@")};
							if(!dataset.dynamic){
								dataset.dynamic = [];
							}
							dataset.dynamic.push(obj);
						}
						$('#dsColumn_div').dialog('close');
						
						reloadDynamicCol(dataset);
					}
				},{
					text:'取消',
					handler:function(){
						$('#dsColumn_div').dialog('close');
					}
				}]
		});
	};
	
	$("#datasettabs #dynamiccoldel").bind("click", function(){
		if(!confirm("是否确认删除？")){
			return;
		}
		var idx = -1;
		var name = $(this).attr("col");
		for(i=0; i<dataset.dynamic.length; i++){
			if(dataset.dynamic[i].name == name){
				idx = i;
				break;
			}
		}
		dataset.dynamic.splice(idx, 1);
		reloadDynamicCol(dataset);
	});
	$("#datasettabs #dynamiccolupdate").bind("click", function(){
		var name = $(this).attr("col");
		var o = null;
		for(i=0; i<dataset.dynamic.length; i++){
			if(dataset.dynamic[i].name == name){
				o = dataset.dynamic[i];
				break;
			}
		}
		dynamicfunc(o);
	});
	$("#datasettabs #dynamiccol").bind("click", function(){
		dynamicfunc();
	}).linkbutton({iconCls:"icon-add"});
}
function delDatasetFilter(paramId){
	if(confirm("是否确认删除？")){
		var dset = curTmpInfo.curDset;
		var idx = -1;
		for(i=0;i<dset.param.length;i++){
			if(dset.param[i].id == paramId){
				idx = i;
			}
		}
		dset.param.splice(idx, 1);
		reloadDatasetFilter(dset);
	}
}
function newdatasetparam(isupdate, paramId){
	var dset = curTmpInfo.curDset;
	var t = null;
	if(dset.param){
		for(i=0;i<dset.param.length;i++){
			if(dset.param[i].id == paramId){
				t = dset.param[i];
			}
		}
	}
	if($("#dsColumn_div").size() == 0){
		$("<div id=\"dsColumn_div\" class=\"easyui-menu\"></div>").appendTo("body");
	}
	var cols = "<select id=\"filtercolumn\" name=\"filtercolumn\" class=\"inputform\">";
	for(i=0; i<dset.cols.length; i++){ //只筛选主表
		if(dset.cols[i].tname != dset.master){
			continue;
		}
		cols = cols + "<option value='"+dset.cols[i].name+"@"+dset.cols[i].tname+"' "+( t!=null&&t.col==dset.cols[i].name&&t.tname==dset.cols[i].tname?"selected":"" )+">"+ (dset.cols[i].dispName=='' ? dset.cols[i].name : dset.cols[i].dispName)+"</option>";
	}
	cols = cols + "</select>";
	var colLogic = ["=",">", ">=","<", "<=", "!=", "between"];
	var ftp = "<select id=\"filtertype\" name=\"filtertype\" class=\"inputform\">";
	for(i=0; i<colLogic.length; i++){
		ftp = ftp + "<option value=\""+colLogic[i]+"\" "+(t!=null&&t.type==colLogic[i]?"selected":"")+">"+colLogic[i]+"</option>";
	}
	ftp = ftp + "</select>";
	
	var ctx = "<div class=\"textpanel\"><span class=\"inputtext\">筛选字段：</span>"+cols+"<br/><span class=\"inputtext\">判断条件：</span>"+ftp+"<br/><span class=\"inputtext\">筛选值：</span><input type=\"text\" name=\"filtervalue\" id=\"filtervalue\" value=\""+(t!=null?t.val:"")+"\" class=\"inputform\"><br><div style=\""+(t!=null&&t.val2!=''?"":"display:none")+"\"><span class=\"inputtext\">筛选值2：</span><input type=\"text\" name=\"filtervalue2\" id=\"filtervalue2\" value=\""+(t!=null?t.val2:"")+"\" "+" class=\"inputform\"></div><span class=\"inputtext\">筛选值类型：</span><select name=\"valuetype\" id=\"valuetype\" class=\"inputform\"><option value=\"number\" "+(t!=null&&t.valuetype=='number'?"selected":"")+">数字类型</option><option value=\"string\" "+(t!=null&&t.valuetype=='string'?"selected":"")+">字符类型</option><option value=\"datetime\" "+((t!=null&&t.valuetype=='datetime'?"selected":""))+">日期类型</option></select></div>";
	$('#dsColumn_div').dialog({
		title: (isupdate == false ? '添加筛选条件':'编辑筛选条件'),
		width: 380,
		height: 260,
		closed: false,
		cache: false,
		modal: true,
		toolbar:null,
		content:ctx,
		onLoad:function(){},
		onClose:function(){
			$('#dsColumn_div').dialog('destroy');
		},
		buttons:[{
				text:'确定',
				handler:function(){
					if(!dset.param){
						dset.param = [];
					}
					if($("#dsColumn_div #filterid").val() == ''){
						msginfo("筛选标识是必填项！");
						$("#dsColumn_div #filterid").focus();
						return;
					}
					if(isupdate == true){
						var spt = $("#dsColumn_div #filtercolumn").val().split("@");
						t.col = spt[0];
						t.tname = spt[1]; 
						t.type = $("#dsColumn_div #filtertype").val();
						t.val = $("#dsColumn_div #filtervalue").val();
						t.val2 = $("#dsColumn_div #filtervalue2").val();
						t.valuetype = $("#dsColumn_div #valuetype").val();
					}else{
						var spt = $("#dsColumn_div #filtercolumn").val().split("@");
						dset.param.push({id:newGuid(),col:spt[0], tname:spt[1], type:$("#dsColumn_div #filtertype").val(), val:$("#dsColumn_div #filtervalue").val(), val2:$("#dsColumn_div #filtervalue2").val(), valuetype:$("#dsColumn_div #valuetype").val()});
					}
					reloadDatasetFilter(dset);
					$('#dsColumn_div').dialog('close');
				}
			},{
				text:'取消',
				handler:function(){
					$('#dsColumn_div').dialog('close');
				}
			}]
	});
	$("#dsColumn_div #filtertype").bind("change", function(){
		if($(this).val() == 'between'){
			$("#dsColumn_div #filtervalue2").parent().css("display", "block");
		}else{
			$("#dsColumn_div #filtervalue2").parent().css("display", "none");
		}
	});
}
function editDsColumn(colId, datasetid, tname, income){
	if($("#dsColumn_div").size() == 0){
		$("<div id=\"dsColumn_div\" class=\"easyui-menu\"></div>").appendTo("body");
	}
	var dset;
	if(datasetid == null){
		dset = curTmpInfo.curDset;
	}else{
		dset = findDatasetById(datasetid);
	}
	var tmp = null;
	for(var i=0; i<dset.cols.length; i++){
		if(dset.cols[i].name == colId && dset.cols[i].tname == tname){
			tmp = dset.cols[i];
			break;
		}
	}
	var tps = "";
	for(var i=0; i<dataType.length; i++){
		tps = tps + "<option value=\""+dataType[i]+"\" "+(tmp.type == dataType[i] ? "selected" : "")+">"+dataType[i]+"</option>";
	}
	var joinInfo = null;
	//查询表字段关联信息
	for(j=0; dset.joininfo && j<dset.joininfo.length; j++){
		//是主表，字段相同
		if( dset.master==tmp.tname && dset.joininfo[j].col == tmp.name){
			joinInfo = dset.joininfo[j];
			break;
		}else
		if(tmp.tname == dset.joininfo[j].ref && tmp.name == dset.joininfo[j].refKey ){
			joinInfo =  dset.joininfo[j];
			break;
		}
	}
	var ctx = "<div class=\"textpanel\"><span class=\"inputtext\">字段名：</span>"+tmp.name+"<br/><span class=\"inputtext\">显示名：</span><input type=\"text\" name=\"coldispname\" id=\"coldispname\" value=\""+tmp.dispName+"\" class=\"inputform\"><br/><span class=\"inputtext\">类型：</span><select id=\"coltype\" class=\"inputform\">"+tps+"</select><br/><span class=\"inputtext\">来源表：</span>"+tmp.tname+"<br/><span class=\"inputtext\">字段关联：</span>"+(joinInfo==null?"字段无关联":dset.master+"."+joinInfo.col+" -> " + joinInfo.ref+"."+joinInfo.refKey)+(joinInfo!=null?"<br/><span class=\"inputtext\">关联类型：</span>"+(joinInfo.jtype=="all"?"全连接":(joinInfo.jtype=="left"?"左连接":"右连接")):"")+(joinInfo==null?"":"<br/><span class=\"inputtext\">强制连接：</span>"+(joinInfo.force=="y"?"是":"否"))+"</div>";
	$('#dsColumn_div').dialog({
		title: '编辑字段信息',
		width: joinInfo == null ? 350 : 450,
		height: joinInfo == null ? 240:300,
		closed: false,
		cache: false,
		modal: true,
		toolbar:null,
		content:ctx,
		onLoad:function(){},
		onClose:function(){
			$('#dsColumn_div').dialog('destroy');
		},
		buttons:[{
				text:'确定',
				handler:function(){
					tmp.dispName = $("#dsColumn_div #coldispname").val();
					tmp.type = $("#dsColumn_div #coltype").val();
					curTmpInfo.isupdate = true;
					if(income == 'panel'){
						//回写值
						$("#datasettabs #"+tmp.tname+"_"+tmp.name+"_disp").text(tmp.dispName);
						$("#datasettabs #"+tmp.tname+"_"+tmp.name+"_tp").text(tmp.type);
					}else if(income == 'col'){
						var node = $("#mydatatree").tree("getSelected");
						$("#mydatatree").tree("update", {target:node.target, text:(tmp.dispName==''?tmp.name:tmp.dispName)});
					}
					curTmpInfo.isupdate = true;
					$('#dsColumn_div').dialog('close');
				}
			},{
				text:'取消',
				handler:function(){
					$('#dsColumn_div').dialog('close');
				}
			}]
	});
}
function newcube(isupdate, cubeId){
	if(!pageInfo.dataset){
		msginfo("创建立方体前，请先创建数据集！");
		return;
	}
	var cubeObj = null; 
	if(cubeId){
		cubeObj = fundCubeById(cubeId);
	}
	$('#pdailog').dialog({
		title: isupdate == true ? '编辑立方体' : "创建立方体",
		width: 700,
		height: 500,
		closed: false,
		cache: false,
		modal: true,
		toolbar:null,
		content:'<div id="cubetabs" ><div title="数据集" ></div><div title="维度和度量"></div>'+(cubeObj!=null?'<div title="聚集"></div><div title="分表"></div><div title="缓存"></div><div title="定时任务"></div>':'')+'</div>',
		onLoad:function(){
		},
		buttons:[{
				text:'确定',
				handler:function(){
					//判断是否填名字
					if($("#pdailog #cubename").val() == ''){
						msginfo("您还未录入立方体名称。");
						return;
					}
					if(!pageInfo.cube){
						pageInfo.cube = [];
					}
					if(isupdate){
						cubeObj.datasetid = $("#pdailog #datasetid").val();
						cubeObj.name = $("#pdailog #cubename").val();
						cubeObj.note = $("#pdailog #note").val();
						cubeObj.cache = "true" == $("input[name='cache']:radio:checked").val();
						//设置定时任务
						var jobState =  $("#pdailog input[name='autoAggre']:radio:checked").val();
						if(jobState  == 'yes'){  //设置任务
							if(!pageInfo.id){
								msginfo("请先保存报表。");
								return;
							}
							var hour = $("#pdailog #hour").val();
							var minute = $("#pdailog #minute").val();
							var week = $("#pdailog #week").val();
							var day = $("#pdailog #day").val();
							var period = $("#pdailog #period").val();
							cubeObj.job = {period:period,hour:hour, minute:minute, week:week, day:day};
							$.ajax({
								type:'POST',
								url:'Job!startJob.action',
								data:{fileId:pageInfo.id,cubeId:cubeObj.id, job:JSON.stringify(cubeObj.job)},
								dataType:"HTML",
								success:function(){
									
								}
							});
						}else if(jobState == "no"){
							delete cubeObj.job;  //删除任务
							$.ajax({
								type:'POST',
								url:'Job!stopJob.action',
								data:{fileId:pageInfo.id,cubeId:cubeObj.id},
								dataType:"HTML",
								success:function(){
								},
								error:function(){
								}
							});
						}
						var root = $("#cuberighttree").tree("getRoot");
						var curCube = $("#mydatatree").tree("getSelected");
						$("#mydatatree").tree("update", {target:curCube.target, text: cubeObj.name});
						
						//保存分表信息
						 var divison = $("#pdailog input[name='division']:radio:checked").val();
						 if("y" == divison){
							 var divisonCol = $("#pdailog #divisonCol").val();
							 var divisonNumber = $("#pdailog #divisonNumber").val();
							 cubeObj.divison = {col:divisonCol, number:divisonNumber, tabs:[]};
							 var endls = $("#pdailog input[name='divisonEND']");
							$("#pdailog input[name='divisonST']").each(function(index, element) {
								var val = $(this).val();
								cubeObj.divison.tabs.push({idx:index, st:val, end:endls.get(index).value});
							});
						 }else if("n" == divison){
							 delete cubeObj.divison;
						 }
						
						//如果修改了维度或度量，更新维和度量
						if(root != null){
							cubeObj.dim = [];
							cubeObj.kpi = [];
							
							//更新立方体子节点
							var columns = $("#mydatatree").tree("getChildren", curCube.target);
							//先删除
							for(var i=0;i<columns.length; i++){
								$("#mydatatree").tree("remove", columns[i].target);
							}
							var tmpColumns = [];
							var ls = $("#cuberighttree").tree("getChildren", root.target);
							var curGroup = null;
							var curGroup2 = null;
							for(i=0;i<ls.length;i++){
								var t = ls[i];
								if(t.attributes && (t.attributes.tp == 'dim' || t.attributes.tp == 'group')){ //维度 , 分组
									if(curGroup != null){ //如果上级不是group,清除当前curGroup
										var parent =  $("#cuberighttree").tree("getParent", t.target);
										if(!parent.attributes || parent.attributes.tp != 'group'){
											curGroup = null;
											curGroup2 = null;
										}
									}
									if(t.attributes.tp == 'group'){
										var o = {id:t.id,name:t.attributes.dispName,grouptype:t.attributes.grouptype,tp:'group', children:[]};
										cubeObj.dim.push(o);
										curGroup2 = o.children;
									}else{
										var tg = curGroup2 == null ? cubeObj.dim : curGroup2;
										tg.push({id:t.id, name:t.attributes.dispName,tp:'dim',col:t.attributes.col,tname:t.attributes.tname,codetable:(t.attributes.codetable?t.attributes.codetable:""),keycol:(t.attributes.keycol?t.attributes.keycol:""),valcol:(t.attributes.valcol?t.attributes.valcol:""),vtype:t.attributes.vtype,refId:t.attributes.refId,dimtype:(t.attributes.dimtype?t.attributes.dimtype:""),dyna:(t.attributes.dyna?t.attributes.dyna:false),dateformat:t.attributes.dateformat});
									}
									if(t.attributes.tp == 'group'){
										var o = {id:t.id,text:t.text,iconCls:'icon-group',attributes:{col_type:'group', showmenu:true,drag:'n',type:'group',cubeId:cubeObj.id}, children:[]};
										tmpColumns.push(o);
										curGroup = o.children;
									}else{
										var tg = curGroup == null ? tmpColumns : curGroup;
										tg.push({id:t.id,text:t.text,iconCls:'icon-dim',attributes:{col_type:'dim',showmenu:true,drag:'n',type:'dim',cubeId:cubeObj.id}});
									}
								}else if(t.attributes && t.attributes.tp == 'kpi'){ //度量
									cubeObj.kpi.push({id:t.id,name:t.attributes.dispName,col:t.attributes.col,tname:t.attributes.tname,fmt:(t.attributes.fmt?t.attributes.fmt:""),unit:(t.attributes.unit?t.attributes.unit:""),aggre:(t.attributes.aggre?t.attributes.aggre:""),kpinote:(t.attributes.kpinote?t.attributes.kpinote:""),calc:(t.attributes.calc?t.attributes.calc:false),dimtype:(t.attributes.dimtype?t.attributes.dimtype:""),dyna:(t.attributes.dyna?t.attributes.dyna:false)});
									tmpColumns.push({id:t.id,text:t.text,iconCls:(t.attributes.calc?"icon-ckpi":'icon-kpi'),attributes:{col_type:'kpi',showmenu:true,drag:'n',type:'kpi',cubeId:cubeObj.id}});
								}
							}
							 $("#mydatatree").tree("append", {parent:curCube.target, data:tmpColumns});
						}
						
						
					}else{
						var root = $("#cuberighttree").tree("getRoot");
						if(root == null){
							msginfo("您还未设置立方体的维和度量。");
							return;
						}
						var cube = {id:newGuid(),dim:[],kpi:[],datasetid:$("#pdailog #datasetid").val(), name:$("#pdailog #cubename").val(),note:$("#pdailog #note").val()};
						var child = [];
						var ls = $("#cuberighttree").tree("getChildren", root.target);
						var curGroup = null;
						var curGroup2 = null;
						for(i=0;i<ls.length;i++){
							var t = ls[i];
							if(t.attributes && (t.attributes.tp == 'dim' || t.attributes.tp == 'group')){ //维度 分组
							    if(curGroup != null){ //如果上级不是group,清除当前curGroup
									var parent =  $("#cuberighttree").tree("getParent", t.target);
									if(!parent.attributes || parent.attributes.tp != 'group'){
										curGroup = null;
										curGroup2 = null;
									}
								}
								if(t.attributes.tp == 'group'){
									var o = {id:t.id,name:t.attributes.dispName,grouptype:t.attributes.grouptype,tp:'group', children:[]};
									cube.dim.push(o);
									curGroup2 = o.children;
								}else{
									var tg = curGroup2 == null ? cube.dim : curGroup2;
									tg.push({id:t.id, name:t.attributes.dispName,tp:'dim',col:t.attributes.col,tname:t.attributes.tname,codetable:(t.attributes.codetable?t.attributes.codetable:""),keycol:(t.attributes.keycol?t.attributes.keycol:""),valcol:(t.attributes.valcol?t.attributes.valcol:""),vtype:t.attributes.vtype,refId:t.attributes.refId,dimtype:(t.attributes.dimtype?t.attributes.dimtype:""),dyna:t.attributes.dyna,dateformat:t.attributes.dateformat});
								}
								if(t.attributes.tp == 'group'){
									var o = {id:t.id,text:t.text,iconCls:'icon-group',attributes:{col_type:'group',showmenu:true,drag:'n',type:'group',cubeId:cube.id}, children:[]};
									child.push(o);
									curGroup = o.children;
								}else{
									var tg = curGroup == null ? child : curGroup;
									tg.push({id:t.id,text:t.text,iconCls:'icon-dim',attributes:{col_type:'dim',showmenu:true,drag:'n',type:'dim',cubeId:cube.id}});
								}
							}else if(t.attributes && t.attributes.tp == 'kpi'){ //度量
								cube.kpi.push({id:t.id,name:t.attributes.dispName,col:t.attributes.col,tname:t.attributes.tname,fmt:t.attributes.fmt,unit:t.attributes.unit,aggre:t.attributes.aggre,kpinote:t.attributes.kpinote,calc:(t.attributes.calc?t.attributes.calc:false),dyna:t.attributes.dyna});
								child.push({id:t.id,text:t.text,iconCls:(t.attributes.calc?"icon-ckpi":'icon-kpi'),attributes:{col_type:'kpi',showmenu:true,drag:'n',type:'kpi',cubeId:cube.id}});
							}
						}
						//添加节点
						$("#mydatatree").tree("append", {parent:$("#mydatatree div[node-id='lft']"), data:[{id:cube.id, text:cube.name,iconCls:'icon-cube',attributes:{showmenu:true,type:'cube'}, children:child}]});
						pageInfo.cube.push(cube);
						$("#l_tab").tabs("select", 1);
					}
					//更新数据tree
					initselectDataTree();
					curTmpInfo.isupdate = true;
					$('#pdailog').dialog('close');
				}
			},{
				text:'取消',
				handler:function(){
					$('#pdailog').dialog('close');
				}
			}]
	});
	$("#cubetabs").tabs({border:false,fit:true,tabPosition:"left","plain":false, onSelect:function(a, b){
		var str = "<div class=\"textpanel\" style=\"\">";
		if(b == 0){
			var pp = $('#cubetabs').tabs('getSelected');
			if($(pp).html() != ''){
				return;
			}
			var dsls = "";
			for(i=0; i<pageInfo.dataset.length; i++){
				var ds = pageInfo.dataset[i];
				if(isupdate){
					dsls = dsls + (cubeObj!=null&&cubeObj.datasetid==ds.datasetid?"<option value=\""+ds.datasetid+"\">"+ds.name+"</option>":"")
				}else{
					dsls = dsls + "<option value=\""+ds.datasetid+"\" "+(cubeObj!=null&&cubeObj.datasetid==ds.datasetid?"selected":"")+">"+ds.name+"</option>";
				}
			}
			str = str + "<span class=\"inputtext\">立方体名称：</span><input type=\"text\" class=\"inputform\" name=\"cubename\" id=\"cubename\" value=\""+(cubeObj==null?"":cubeObj.name)+"\"><br>";
			str = str + "<span class=\"inputtext\">数据集：</span><select class=\"inputform\" id=\"datasetid\" name=\"datasetid\">"+dsls+"</select>"+(isupdate?"(不可更改)":"");
			str = str + "<br/><table cellspacing=\"0\" cellpadding=\"0\"><tr><td valign=\"top\"><span class=\"inputtext\">备注信息：</span></td><td><textarea rows=\"4\" cols=\"35\" id=\"note\" name=\"note\">"+(cubeObj!=null&&cubeObj.note?cubeObj.note:"")+"</textarea></td></tr></table><br/><font color=\"#999\">(创建好立方体后，即可对立方体进行多维分析。)</font>";
			str = str + "</div>";
			$(pp).html(str);
		}else if(cubeObj != null && b == 3){ //分表
			var pp = $('#cubetabs').tabs('getSelected');
			if($(pp).html() != ""){
				return;
			}
			//查询主表字段：
			var dset = findDatasetById(cubeObj.datasetid);
			var cols = "<option value=\"\"></option>";
			for(j=0; j<dset.cols.length; j++){
				var c = dset.cols[j];
				if(c.tname != dset.master){
					continue;
				}
				cols =cols + "<option value=\""+c.name+"\" "+(cubeObj.divison && cubeObj.divison.col == c.name?"selected":"")+">"+(c.dispName == '' ?c.name:c.dispNames)+"</option>"
			}
			//分表数
			var tbs = "<option value=\"\"></option>";
			for(j=2; j<=16; j++){
				tbs = tbs + "<option value=\""+j+"\" "+(cubeObj.divison && cubeObj.divison.number == j ?"selected":"")+">"+j+"</option>";
			}
		    var str = "<div class=\"textpanel\"><fieldset><legend>通过对立方体分多个子表来提高查询效率</legend><label><input type=\"radio\" value=\"y\" name=\"division\" id=\"division\" "+(cubeObj!=null&&cubeObj.divison?"checked":"")+">启用分表</label> <label><input type=\"radio\" value=\"n\" name=\"division\" id=\"division\" "+(cubeObj==null||!cubeObj.divison?"checked":"")+">禁用分表</label> <div id=\"divisionDiv\">分表字段：<select id=\"divisonCol\">"+cols+"</select> &nbsp; 分表数量：<select id=\"divisonNumber\">"+tbs+"<select> &nbsp; (数量应该对应CPU核数)<br/><div id=\"divisonInfo\"></div><input type='button' id='exeDivison' value='执行分表'></div></div></fieldset></div>";
			$(pp).html(str);
			if(cubeObj==null||!cubeObj.divison){
				$("#divisionDiv").hide();
			}
			$("#pdailog input[name='division']:radio").click(function(){
				if($(this).val() == "y"){
					$("#divisionDiv").show();
				}else{
					$("#divisionDiv").hide();
				}
			});
			/**
			根据序号查询分表对象
			**/
			var findTabByIdx = function(idx){
				var ret = null;
				for(k=0; cubeObj.divison&&cubeObj.divison.tabs&&k<cubeObj.divison.tabs.length; k++){
					if(k == idx){
						ret = cubeObj.divison.tabs[k];
						break;
					}
				}
				return ret;
			}
			var resetDivision = function(wback){
				var divisonNumber = $("#pdailog #divisonNumber").val();
				var divisonCol = $("#pdailog #divisonCol").val();
				if(divisonNumber != "" && divisonCol != ""){
					var s = "";
					for(i=0; i<Number(divisonNumber); i++){
						var t = findTabByIdx(i);
						s = s + "<div>第"+(i+1)+"个表, "+divisonCol+" 数据区间：<input name=\"divisonST\" type='text' value='"+(wback?t.st:"")+"' style='width:80px;'> 到 <input name=\"divisonEND\" type='text' style='width:80px;' value='"+(wback?t.end:"")+"'> </div>";
					}
					$("#pdailog #divisonInfo").html(s);
				}else{
					$("#pdailog #divisonInfo").html("");
				}
			};
			$("#pdailog #divisonCol,#pdailog #divisonNumber").change(function(){
				resetDivision(false);
			});
			resetDivision(true);
			//执行分表
			$("#pdailog #exeDivison").click(function(){
				var p = {col:$("#pdailog #divisonCol").val(), number:$("#pdailog #divisonNumber").val(), tabs:[]};
				var endls = $("#pdailog input[name='divisonEND']");
				$("#pdailog input[name='divisonST']").each(function(index, element) {
					var val = $(this).val();
                    p.tabs.push({idx:index, st:val, end:endls.get(index).value});
                });
				var dset = findDatasetById($("#pdailog #datasetid").val());
				var ds = findDatasourceById(dset.dsid);
				$.messager.progress({
					title:'请稍后...',
					msg:'正在划分立方体子表...'
				});
				$.ajax({
					type:"POST",
					url: "Division.action",
					dataType:"html",
					data: {division:JSON.stringify(p), "dset":JSON.stringify(dset),"dsource":JSON.stringify(ds),"cube":JSON.stringify(cubeObj)},
					success: function(resp){
						$.messager.progress('close');
						alert("立方体生成子表成功。");
					},
					error:function(a,b,c){
						$.messager.progress('close');
						alert("立方体分表失败，请查看后台日志。");
					}
				});
				
			});
		}else
		if(cubeObj != null && b == 4){ //缓存
		    var pp = $('#cubetabs').tabs('getSelected');
		    var str = "<div class=\"textpanel\"><fieldset><legend>立方体缓存</legend><label><input type=\"radio\" value=\"true\" name=\"cache\" id=\"cache\" "+(cubeObj!=null&&cubeObj.cache==true?"checked":"")+">启用缓存</label> <label><input type=\"radio\" value=\"false\" name=\"cache\" id=\"cache\" "+(cubeObj==null||!cubeObj.cache||cubeObj.cache==false?"checked":"")+">停用缓存</label> &nbsp; <input type='button' value='删除已缓存数据' id='delcache'></fieldset></div>";
		    $(pp).html(str);
			var cube = cubeObj;
			$("#pdailog #delcache").click(function(){
				showloading();
				$.ajax({
					type:"POST",
					url: "Cache!delCache.action",
					dataType:"html",
					data: {"cubeId":cube.id},
					success: function(resp){
						hideLoading();
						alert("删除立方体缓存成功。");
					},
					error:function(a,b,c){
						hideLoading();
						alert("删除立方体缓存出错，请稍后再试。");
					}
				});
			});
		}else if(cubeObj != null && b == 5){ //定时任务
		    var pp = $('#cubetabs').tabs('getSelected');
			var job = cubeObj.job; //自动聚集的定时任务
			//小时字符串
			var hour = "";
			for(i=0; i<=23; i++){
				hour = hour + "<option value=\""+i+"\" "+(job&&job.hour==i?"selected":"")+">" + i + "</option>";
			}
			//分钟字符串
			var minute = "";
			for(i=0; i<60; i++){
				minute = minute + "<option value=\""+i+"\" "+(job&&job.minute==i?"selected":"")+">"+i+"</option>";
			}
			//周字符串
			var week = "";
			for(i=0; i<=6; i++){
				week =week + "<option value=\""+(i + 1)+"\" "+(job&&job.week==(i + 1)?"selected":"")+">"+(i == 0 ? "日": i)+"</option>";
			}
			//日字符串
			var day = "";
			for(i=1; i<=31; i++){
				day = day + "<option value=\""+i+"\" "+(job&&job.day==i?"selected":"")+">"+i+"</option>";
			}
			var str = "<div class=\"textpanel\" style=\"\"><fieldset><legend>设置定时任务自动执行</legend><label><input type='radio' value='yes' name='autoAggre' id='autoAggre' "+(job?"checked":"")+">启用定时任务</label> &nbsp; <label><input type='radio' value='no' name='autoAggre' id='autoAggre' "+(!job?"checked":"")+">关闭定时任务</label><div id=\"jobdiv\"><select id=\"period\" name=\"period\" style=\"width:70px;\"><option value=\"day\" "+(job&&job.period=="day"?"selected":"")+">每天</option><option value=\"week\" "+(job&&job.period=="week"?"selected":"")+">每周</option><option value=\"month\" "+(job&&job.period=="month"?"selected":"")+">每月</option></select> <div id=\"weekdiv\">星期<select id=\"week\" name=\"week\">"+week+"</select></div> <div id=\"daydiv\"><select id=\"day\" name=\"day\">"+day+"</select>号</div> <div id=\"timediv\"><select id=\"hour\" name=\"hour\">"+hour+"</select>点：<select id=\"minute\" name=\"minute\">"+minute+"</select>分</div><div>执行内容：<br/>1.删除聚集表并重新聚集数据。<br/>2.删除立方体子表并生成新的表。<br/>3.删除已有缓存。</div></div></fieldset></div>";
			//alert(str);
			$(pp).html(str);
			var changeevent = function(v){
				if(v == "day"){
					$("#pdailog #weekdiv").hide();
					$("#pdailog #daydiv").hide();
					$("#pdailog #hourdiv").hide();
					$("#pdailog #timediv").show();
				}else if(v == "month"){
					$("#pdailog #weekdiv").hide();
					$("#pdailog #hourdiv").hide();
					$("#pdailog #daydiv").show();
					$("#pdailog #timediv").show();
				}else if(v == "week"){
					$("#pdailog #weekdiv").show();
					$("#pdailog #hourdiv").hide();
					$("#pdailog #daydiv").hide();
					$("#pdailog #timediv").show();
				}
			};
			$("#pdailog #period").change(function(){
				var v = $(this).val();
				changeevent(v);
			});
			changeevent($("#pdailog #period").val());
			var showjobdiv = function(v){
				if(v == "yes"){ //启用自动聚集
					/**
					if(!cubeObj.aggreTable || cubeObj.aggreTable == ''){
						msginfo("请先聚集立方体，再启用自动聚集。");
						$("#pdailog input[name=autoAggre]:eq(1)").attr("checked",'checked'); 
						return;
					}
					**/
					$("#pdailog #jobdiv").show();
				}else{  //关闭自动聚集
					$("#pdailog #jobdiv").hide();
				}
			}
			
			$("#pdailog input[name='autoAggre']:radio").click(function(){
				var val = $(this).val();
				showjobdiv(val);
			});
			showjobdiv($("#pdailog input[name='autoAggre']:radio:checked").val());
		}else
		if(cubeObj != null && b == 2){  //立方体聚集
			var pp = $('#cubetabs').tabs('getSelected');
			var str = "<div class=\"textpanel\" style=\"\"><fieldset><legend>通过聚集立方体提高查询效率</legend><input type=\"button\" value=\"聚集立方体\" id=\"aggrecube\"> &nbsp; <input type=\"button\" value=\"取消聚集\" id=\"notAggre\"><div align=\"center\" id=\"aggremsg\">"+(cubeObj.aggreTable?"当前聚集表："+cubeObj.aggreTable:"")+"</div></fieldset></div>";
			//alert(str);
			$(pp).html(str);
			var dset = findDatasetById($("#pdailog #datasetid").val());
			var ds = findDatasourceById(dset.dsid);
			var cube = cubeObj;
			$("#pdailog #aggrecube").click(function(){
				$(this).attr("disabled", "disabled");
				$.messager.progress({
					title:'请稍后...',
					msg:'立方体数据聚集中...'
				});
				$.ajax({
					type:"POST",
					url: "AggreCube.action",
					dataType:"html",
					data: {"dset":JSON.stringify(dset),"dsource":JSON.stringify(ds),"cube":JSON.stringify(cube)},
					success: function(resp){
						$.messager.progress('close');
						alert("立方体聚集成功。");
						$("#pdailog #aggremsg").html("立方体聚集后生成表： <b>"  + resp +"</b>");
						//给立方体回写表名
						cube.aggreTable = resp;
						savepage(false,undefined, true);
					},
					error:function(a,b,c){
						$.messager.progress('close');
						alert("立方体聚集出错，请稍后再试。");
					}
				});
			});
			$("#pdailog #notAggre").click(function(){
				delete cube.aggreTable;
				delete cube.job;  //删除任务
				//关闭自动聚集
				$("#pdailog input[name=autoAggre]:eq(1)").attr("checked",'checked'); 
				$("#pdailog #jobdiv").hide();
				$("#pdailog #aggremsg").html("");
				savepage(false,undefined, true);
				alert("取消立方体聚集成功。");
			});
			
		}else
		if(b == 1){
			var treels = "";
			var dset = findDatasetById($("#cubetabs #datasetid").val());
			var cols = dset.cols;
			//添加主表字段
			treels = treels + "<li data-options=\"iconCls:'icon-table'\"><span>"+dset.master+"</span><ul>";
			for(i=0; i<cols.length; i++){
				if(cols[i].tname == dset.master){
					treels = treels + "<li data-options=\"id:'"+cols[i].name+"',iconCls:'icon-dscol',attributes:{tp:'node', tname:'"+cols[i].tname+"', vtype:'"+cols[i].type+"', col:'"+cols[i].name+"', dyna:false}\"><span>"+(cols[i].dispName == '' ? cols[i].name : cols[i].dispName)+"</span></li>";
				}
			}
			treels = treels + "</ul></li>";
			var findtabcols = function(tname){
				var ret = [];
				for(k=0; k<cols.length; k++){
					if(cols[k].tname == tname){
						ret.push(cols[k]);
					}
				}
				return ret;
			}
			//添加关联表字段
			for(i=0; dset.joininfo&&i<dset.joininfo.length; i++){
				treels = treels + "<li data-options=\"iconCls:'icon-table'\"><span>"+dset.joininfo[i].ref+"</span><ul>";
				var tabcols = findtabcols(dset.joininfo[i].ref);
				for(j=0; j<tabcols.length; j++){
					var o = tabcols[j];
					treels = treels + "<li data-options=\"id:'"+o.name+"',iconCls:'icon-dscol',attributes:{tp:'node', tname:'"+o.tname+"', vtype:'"+o.type+"', col:'"+o.name+"', dyna:false}\"><span>"+(o.dispName == '' ? o.name : o.dispName)+"</span></li>";
				}
				treels = treels + "</ul></li>";
			}
			//加载动态列
			treels = treels + "<li data-options=\"iconCls:'icon-table'\"><span>动态字段</span><ul>";
			for(i=0; dset.dynamic && i<dset.dynamic.length; i++){
				var t = dset.dynamic[i];
				treels = treels + "<li data-options=\"id:'"+t.name+"',iconCls:'icon-dscol',attributes:{tp:'node', tname:'"+t.tname+"', vtype:'"+t.type+"', col:'"+(t.expression)+"', dyna:true}\"><span>"+t.name+"</span></li>";
			}
			treels = treels + "</ul></li>";
			var dims = "";
			if(cubeObj != null){
				dims = dims +  "<ul>";
				for(i=0;i<cubeObj.dim.length; i++){
					if(cubeObj.dim[i].tp == 'dim'){
						dims = dims + "<li data-options=\"id:'"+cubeObj.dim[i].id+"',iconCls:'icon-dim',attributes:{tp:'dim',drag:true,col:'"+cubeObj.dim[i].col+"',dispName:'"+cubeObj.dim[i].name+"',tname:'"+cubeObj.dim[i].tname+"',codetable:'"+cubeObj.dim[i].codetable+"',keycol:'"+cubeObj.dim[i].keycol+"',valcol:'"+cubeObj.dim[i].valcol+"',vtype:'"+cubeObj.dim[i].vtype+"',refId:'"+cubeObj.dim[i].refId+"',dyna:"+cubeObj.dim[i].dyna+",dimtype:'"+cubeObj.dim[i].dimtype+"',dateformat:'"+(cubeObj.dim[i].dimtype?cubeObj.dim[i].dimtype:"")+"'}\"><span>"+cubeObj.dim[i].name+"</span></li>";
					}else if(cubeObj.dim[i].tp == 'group'){
						dims = dims + "<li data-options=\"id:'"+cubeObj.dim[i].id+"',iconCls:'icon-group',attributes:{tp:'group',dispName:'"+cubeObj.dim[i].name+"',drag:true, grouptype:'"+cubeObj.dim[i].grouptype+"'}\">";
						dims = dims + "<span>"+cubeObj.dim[i].name+"</span>";
						dims = dims + "<ul>";
						for(k=0; k<cubeObj.dim[i].children.length; k++){
							var tt = cubeObj.dim[i].children[k];
							dims = dims + "<li data-options=\"id:'"+tt.id+"',iconCls:'icon-dim',attributes:{tp:'dim',drag:true,col:'"+tt.col+"',dispName:'"+tt.name+"',tname:'"+tt.tname+"',codetable:'"+tt.codetable+"',keycol:'"+tt.keycol+"',valcol:'"+tt.valcol+"',vtype:'"+tt.vtype+"',refId:'"+tt.refId+"',dyna:"+tt.dyna+",dimtype:'"+tt.dimtype+"',dateformat:'"+(tt.dateformat?tt.dateformat:"")+"'}\"><span>"+tt.name+"</span></li>";
						}
						dims = dims + "</ul>";
						dims = dims + "</li>";
					}
				}
				dims = dims + "</ul>";
			}
			var kpis = "";
			if(cubeObj != null){
				kpis = kpis +  "<ul>";
				for(i=0;i<cubeObj.kpi.length; i++){
					kpis = kpis + "<li data-options=\"id:'"+cubeObj.kpi[i].id+"',iconCls:'"+(cubeObj.kpi[i].calc?"icon-ckpi":"icon-kpi")+"',attributes:{tp:'kpi',drag:true,col:'"+(cubeObj.kpi[i].col)+"',dispName:'"+cubeObj.kpi[i].name+"',tname:'"+(cubeObj.kpi[i].tname)+"',unit:'"+(cubeObj.kpi[i].unit?cubeObj.kpi[i].unit:"")+"',fmt:'"+(cubeObj.kpi[i].fmt?cubeObj.kpi[i].fmt:"")+"',aggre:'"+(cubeObj.kpi[i].aggre?cubeObj.kpi[i].aggre:"")+"',calc:"+(cubeObj.kpi[i].calc==true?"true":"false")+",kpinote:'"+(cubeObj.kpi[i].kpinote?cubeObj.kpi[i].kpinote:"")+"',dyna:"+cubeObj.kpi[i].dyna+"}\"><span>"+cubeObj.kpi[i].aggre+"("+cubeObj.kpi[i].name+")"+"</span></li>";
				}
				kpis = kpis + "</ul>";
			}
			var rtree = "<ul id=\"cuberighttree\"><li data-options=\"iconCls:'icon-cube'\"><span>数据立方体</span><ul><li data-options=\"iconCls:'icon-dim',id:'cubewd'\"><span>维度</span>"+dims+"</li><li data-options=\"iconCls:'icon-kpi',id:'cubedl'\"><span>度量</span>"+kpis+"</li></ul></li></ul>";			
			str = str + "<div class=\"cubeleft\"><div class=\"cubetitle\">待选数据字段：</div><ul id=\"cubelefttree\"><li data-options=\"iconCls:'icon-dataset2',attributes:{tp:'root'}\"><span>"+dset.name+"</span><ul>"+treels+"</ul></li></ul></div><div class=\"cubecenter\"><p style=\"height:150px;\"></p><input type=\"button\" onclick=\"ds2cube()\" value=\">\" title=\"选择\"><br><input type=\"button\" title=\"移除\" value=\"<\" onclick=\"cube2ds()\"></div><div class=\"cuberight\"><div class=\"cubetitle\">维度和度量：</div>"+rtree+"</div><div style=\"width:60px;\" class=\"cubecenter\"><a href=\"javascript:;\" id=\"crtdimgroup\" data-options=\"plain:true,iconCls:'icon-add'\">分组</a><a href=\"javascript:editCalcKpi(false);\" id=\"crtcalckpi\" data-options=\"plain:true,iconCls:'icon-add'\">度量</a><a href=\"javascript:editcubecol('"+dset.datasetid+"');\" id=\"dim_editbtn\" data-options=\"plain:true,iconCls:'icon-edit'\">编辑</a><a href=\"javascript:cube2ds();\" id=\"dim_delbtn\" data-options=\"plain:true,iconCls:'icon-cancel'\">删除</a></div>";
			
			str = str + "</div>";
			var pp = $('#cubetabs').tabs('getSelected');
			$(pp).html(str);
			$("#dim_editbtn,#dim_delbtn,#crtdimgroup,#crtcalckpi").linkbutton();
			//添加分组事件
			$("#crtdimgroup").bind("click", function(){
				if($("#dsColumn_div").size() == 0){
					$("<div id=\"dsColumn_div\" class=\"easyui-menu\"></div>").appendTo("body");
				}
				var gctx = "<div class=\"textpanel\"><span class=\"inputtext\">分组名称：</span><input type=\"text\" value=\"\" id=\"groupname\" name=\"groupname\" class=\"inputform\"><br/><span class=\"inputtext\">分组类型：</span><select id=\"grouptype\" name=\"grouptype\" class=\"inputform\"><option value=\"\"></option><option value=\"date\">时间</option></select></div>";
				$('#dsColumn_div').dialog({
					title: "创建维度分组",
					width: 300,
					height: 150,
					closed: false,
					cache: false,
					modal: true,
					toolbar:null,
					content:gctx,
					onLoad:function(){},
					onClose:function(){
						$('#dsColumn_div').dialog('destroy');
					},
					buttons:[{
						text:'确定',
						handler:function(){
							var name = $("#dsColumn_div #groupname").val();
							var grouptype = $("#dsColumn_div #grouptype").val();
							if(name == ''){
								msginfo("请填写分组名称！");
								$("#dsColumn_div #groupname").focus();
								return;
							}
							var cid = findCubeMaxId($("#cuberighttree  div[node-id='cubewd']"));
							var dt = {id:cid,text:name, "iconCls":"icon-group", attributes:{tp:'group',dispName:name,drag:true, grouptype:grouptype}};
							$("#cuberighttree").tree("append",{parent:$("#cuberighttree div[node-id='cubewd']"), data:[dt]});
							$('#dsColumn_div').dialog('close');
						}
					},{
						text:'取消',
						handler:function(){
							$('#dsColumn_div').dialog('close');
						}
					}]
				});
			});
			$("#cubelefttree").tree({
				dnd:false,
				onBeforeDrag:function(target){
					if(target.attributes == undefined){
						//msginfo("请拖放表下面的维度或指标。");
						return false;
					}
					return true;
				},
				onDragEnter:function(target, source){
					return false;
				}
			});
			$("#cuberighttree").tree({
				dnd:true,
				onBeforeDrag:function(target){
					if(target.attributes && target.attributes.drag){
						return true;
					}else{
						return false;
					}
					//return false;
				},
				onDragEnter:function(target, source){
					var node = $("#cuberighttree").tree("getNode", target);
					if(!node.attributes || node.attributes.drag ==false ){
						return false;
					}
					//指标不能拖放到维度区域
					if(source.attributes.tp == 'kpi' && node.attributes.tp == 'dim'){
						return false;
					}
					//维度不能拖到指标区域
					if(node.attributes.tp == 'kpi' && source.attributes.tp == 'dim'){
						return false;
					}
					//分组不能拖到KPI区域
					if(source.attributes.tp == 'group' && node.attributes.tp == 'kpi'){
						return false;
					}
					//分组不能拖到分组的下边
					var parent = $("#cuberighttree").tree("getParent", target);
					if(source.attributes.tp == 'group' && parent.attributes &&  parent.attributes.tp == 'group'){
						return false;
					}
					return true;
				},
				onBeforeDrop:function(target, source, point){
					var node = $("#cuberighttree").tree("getNode", target);
					if(!node.attributes || node.attributes.drag ==false ){
						return false;
					}
					//指标和维度不能拖放到某个指标或维度下边, 只有group 可以
					if(node.attributes.tp == 'kpi' && point == 'append'){
						return false;
					}
					if(node.attributes.tp == 'dim' && point == 'append'){
						return false;
					}
					//指标不能拖放到维度区域
					if(source.attributes.tp == 'kpi' && node.attributes.tp == 'dim'){
						return false;
					}
					//维度不能拖到指标区域
					if(node.attributes.tp == 'kpi' && source.attributes.tp == 'dim'){
						return false;
					}
					//分组不能拖到KPI区域
					if(source.attributes.tp == 'group' && node.attributes.tp == 'kpi'){
						return false;
					}
					//分组不能拖到分组的下边
					var parent = $("#cuberighttree").tree("getParent", target);
					if(source.attributes.tp == 'group' && parent.attributes &&  parent.attributes.tp == 'group'){
						return false;
					}
					//分组不能拖放到分组的里面
					if(source.attributes.tp == 'group' && node.attributes.tp == 'group' && point == 'append'){
						return false;
					}
					return true;
				},
				onDblClick:function(node){
					editcubecol( $("#pdailog #datasetid").val());
				},
				onDrop:function(target, source, point){
					//
				}
			});
			//隐藏已经选择的列
			var findcol = function(cid, tname){
				var ret = null;
				for(j=0;j<cubeObj.dim.length;j++){
					if(cubeObj.dim[j].tp == 'dim'){
						if(cubeObj.dim[j].col == cid && cubeObj.dim[j].tname == tname){
							ret = cubeObj.dim[j];
							break;
						}
					}else if(cubeObj.dim[j].tp == 'group'){
						var ls = cubeObj.dim[j].children;
						for(k=0; k<ls.length; k++){
							if(ls[k].col == cid && ls[k].tname == tname){
								ret = ls[k];
								break;
							}
						}
						if(ret != null){
							break;
						}
					}
				}
				if(ret == null){
					for(j=0;j<cubeObj.kpi.length;j++){
						if(cubeObj.kpi[j].col == cid && cubeObj.kpi[j].tname == tname){
							ret = cubeObj.kpi[j];
							break;
						}
					}
				}
				return ret;
			};
			if(cubeObj != null){
				var nodes = $("#cubelefttree").tree("getChildren", $("#cubelefttree").tree("getRoot").target);
				for(i=0;i<nodes.length;i++){
					var id = null;
					//对于动态列，需要取col
					if(nodes[i].attributes && nodes[i].attributes.dyna){
						id = nodes[i].attributes.col;
					}else{
						id = nodes[i].id;
					}
					if(nodes[i].attributes && findcol(id, nodes[i].attributes.tname) != null){
						$(nodes[i].target).attr("hide", "y").hide();
					}
				}
			}
		}
	}});
}
function editCalcKpi(update, kpiId){
	var kpi;
	if(update){
		kpi = $("#cuberighttree").tree("getSelected");
	}
	var atp = ["sum","avg","count", "max", "min"];
	var tpstr = "";
	for(i=0; i<atp.length; i++){
		tpstr = tpstr + "<option value=\""+atp[i]+"\" "+(kpi && atp[i] == kpi.attributes.aggre ? "selected":"")+">"+atp[i]+"</option>";
	}
	//查询已选指标
	var kpiStr = "";
	var ls = $("#cuberighttree").tree("getChildren", $("#cuberighttree  div[node-id='cubedl']"));
	for(i=0; i<ls.length; i++){
		var k = ls[i].attributes;
		if(k.calc != true){
			kpiStr = kpiStr + "<span name=\""+k.col+"\" aggre=\""+k.aggre+"\" class=\"column\">"+ k.dispName+"</span> ";
		}
	}
	var ctx = "<div class=\"textpanel\"><span class=\"inputtext\">显示名称：</span><input type=\"text\" class=\"inputform\" name=\"kpiname\" id=\"kpiname\" value=\""+(kpi?kpi.attributes.dispName:"")+"\"><br/><table cellspacing=\"0\" cellpadding=\"0\"><tbody><tr><td valign=\"top\"><span class=\"inputtext\">表 达 式：</span></td><td><textarea rows=\"2\" style=\"height:52px;\" cols=\"40\" id=\"expression\" name=\"expression\">"+(kpi?kpi.attributes.col:"")+"</textarea></td></tr></tbody></table><div class=\"actColumn\">"+kpiStr+"</div><span class=\"inputtext\">计算方式：</span><select id=\"kpiaggre\" name=\"kpiaggre\" class=\"inputform\">"+tpstr+"</select><br><span class=\"inputtext\">度量单位：</span><input type=\"text\" value=\""+(kpi?kpi.attributes.unit:"")+"\" class=\"inputform\" name=\"kpiunit\" id=\"kpiunit\"><br/><span class=\"inputtext\">格式化：</span>" + ftmstr("kpifmt","inputform",(kpi?kpi.attributes.fmt:"")) + "<br/><span class=\"inputtext\">指标解释：</span><textarea name=\"kpinote\" id=\"kpinote\"  cols=\"25\" style=\"height:32px;\" rows=\"2\">"+(kpi?kpi.attributes.kpinote:"")+"</textarea></div>";
	if($("#dsColumn_div").size() == 0){
		$("<div id=\"dsColumn_div\" class=\"easyui-menu\"></div>").appendTo("body");
	}
	$('#dsColumn_div').dialog({
		title: "创建表达式度量",
		width: 420,
		height:  390,
		closed: false,
		cache: false,
		modal: true,
		toolbar:null,
		content:ctx,
		onLoad:function(){},
		onClose:function(){
			$('#dsColumn_div').dialog('destroy');
		},
		buttons:[{
				text:'确定',
				handler:function(){
					var name = $("#dsColumn_div #kpiname").val();
					var expression = $("#dsColumn_div #expression").val();
					if(name == ''){
						msginfo("请填写度量名称。");
						$("#dsColumn_div #kpiname").focus();
						return;
					}
					if(expression == ''){
						msginfo("请填写度量表达式。");
						$("#dsColumn_div #expression").focus();
						return;
					}
					if(update){
						kpi.attributes.aggre = $("#dsColumn_div #kpiaggre").val();
						kpi.attributes.fmt = $("#dsColumn_div #kpifmt").val();
						kpi.attributes.unit = $("#dsColumn_div #kpiunit").val();
						kpi.attributes.dispName = name;
						kpi.attributes.kpinote = $("#dsColumn_div #kpinote").val();
						kpi.attributes.col = expression;
						$("#cuberighttree").tree("update", {target:kpi.target, text:kpi.attributes.aggre+"("+name+")"});
					}else{
						var cid = findCubeMaxId($("#cuberighttree  div[node-id='cubedl']"));
						var o = {id:cid, text:$("#dsColumn_div #kpiaggre").val()+"("+name+")",attributes:{tp:"kpi",calc:true,drag:true,aggre:$("#dsColumn_div #kpiaggre").val(),col:expression, dispName:name,tname:"",fmt:$("#dsColumn_div #kpifmt").val(),unit:$("#dsColumn_div #kpiunit").val(),kpinote:$("#dsColumn_div #kpinote").val(),dyna:false},iconCls:"icon-ckpi"};
						$("#cuberighttree").tree("append", {parent:$("#cuberighttree  div[node-id='cubedl']"), data:[o]});
					}
					$('#dsColumn_div').dialog('close');
				}
			},{
				text:'取消',
				handler:function(){
					$('#dsColumn_div').dialog('close');
				}
			}]
	});
	$("#dsColumn_div .actColumn .column").bind("click", function(){
		var txt = $(this).attr("name");
		var aggre = $(this).attr("aggre");
		insertText2focus(document.getElementById("expression"), aggre+"(" + txt + ") ");
	});
}
function editcubecol(datasetid){
	var right = $("#cuberighttree").tree("getSelected");
	if(right == null || !right.attributes){
		msginfo("您还未选择需要编辑的度量或维度。");
		return;
	}
	var colid = right.id;
	if(!colid){
		return;
	}
	//计算指标特殊处理
	if(right.attributes.tp == 'kpi' && right.attributes.calc == true){
		editCalcKpi(true, right.id);
		return;
	}
	var dset = findDatasetById(datasetid);
	var ctx = "";
	var atp = ["sum","avg","count", "max", "min"];
	
	if(right.attributes.tp == 'dim'){
		//查询码表列表
		var tbs = "";
		for(i=0; i<dset.joininfo.length; i++){
			tbs = tbs + "<option value=\""+dset.joininfo[i].ref+"\" "+(right.attributes.codetable == dset.joininfo[i].ref ? "selected":"")+">"+dset.joininfo[i].ref+"</option>";
		}
		var fmtstr = "<option value=\"\"></option>";
		for(i=0; i<dateformat.length; i++){
			fmtstr = fmtstr + "<option value=\""+dateformat[i]+"\" "+(right.attributes.dateformat==dateformat[i]?"selected":"")+">"+dateformat[i]+"</option>";
		}
		ctx = "<div class=\"textpanel\"><span class=\"inputtext\">维度字段：</span>"+right.attributes.col+"<br/><span class=\"inputtext\">显示名称：</span><input type=\"text\" id=\"dimname\" name=\"dimname\" class=\"inputform\" value=\""+right.attributes.dispName+"\"><br/><span class=\"inputtext\">维度类型：</span><select id=\"dimtype\" name=\"dimtype\" class=\"inputform\"><option value=\"\"></option><option value=\"year\" "+(right.attributes.dimtype=='year'?"selected":"")+">年</option><option value=\"quarter\" "+(right.attributes.dimtype=='quarter'?"selected":"")+">季度</option><option value=\"month\" "+(right.attributes.dimtype=='month'?"selected":"")+">月</option><option value=\"day\" "+(right.attributes.dimtype=='day'?"selected":"")+">日</option></select><br/><span class=\"inputtext\">维度格式：</span><select id=\"dateformat\" class=\"inputform\">"+fmtstr+"</select><br/><span class=\"inputtext\">对应维表：</span><select id=\"codetable\" name=\"codetable\" class=\"inputform\"><option value=''></option>"+tbs+"</select><br/><span class=\"inputtext\">KEY字段：</span><select id=\"keycol\" name=\"keycol\" class=\"inputform\"></select><br/><span class=\"inputtext\">Text字段：</span><select id=\"valcol\" name=\"valcol\" class=\"inputform\"></select></div>";
	}else if(right.attributes.tp == 'kpi'){
		var tpstr = "";
		for(i=0; i<atp.length; i++){
			tpstr = tpstr + "<option value=\""+atp[i]+"\" "+(atp[i] == right.attributes.aggre ? "selected":"")+">"+atp[i]+"</option>";
		}
		ctx = "<div class=\"textpanel\"><span class=\"inputtext\">度量字段：</span>"+right.attributes.col+"<br/><span class=\"inputtext\">显示名称：</span><input type=\"text\" id=\"kpiname\" name=\"kpiname\" class=\"inputform\" value=\""+right.attributes.dispName+"\"><br/><span class=\"inputtext\">来源表：</span>"+right.attributes.tname+"<br/>"
		+ "<span class=\"inputtext\">计算方式：</span><select id=\"kpiaggre\" name=\"kpiaggre\" class=\"inputform\">"+tpstr+"</select> <br>"
		+ "<span class=\"inputtext\">度量单位：</span><input type=\"text\" id=\"kpiunit\" name=\"kpiunit\" class=\"inputform\" value=\""+(right.attributes.unit?right.attributes.unit:"")+"\"> <br>"
		+ "<span class=\"inputtext\">格式化：</span>" + ftmstr("kpifmt","inputform",right.attributes.fmt?right.attributes.fmt:"") + "<br/><span class=\"inputtext\">指标解释：</span><textarea name=\"kpinote\" id=\"kpinote\"  cols=\"25\" style=\"height:32px;\" rows=\"2\">"+(right.attributes.kpinote?unescape(right.attributes.kpinote):"")+"</textarea></div>";
	}else if(right.attributes.tp == 'group'){
		ctx = "<div class=\"textpanel\"><span class=\"inputtext\">分组名称：</span><input type=\"text\" id=\"groupname\" name=\"groupname\" value=\""+right.attributes.dispName+"\" class=\"inputform\"><br/><span class=\"inputtext\">分组类型：</span><select id=\"grouptype\" name=\"grouptype\" class=\"inputform\"><option value=\"\"></option><option value=\"date\" "+(right.attributes.grouptype=="date"?"selected":"")+">时间</option></select></div>";
	}
	if($("#dsColumn_div").size() == 0){
		$("<div id=\"dsColumn_div\" class=\"easyui-menu\"></div>").appendTo("body");
	}
	$('#dsColumn_div').dialog({
		title: right.attributes.tp == 'group' ? "编辑分组" : "编辑度量及维度",
		width: 350,
		height:  right.attributes.tp == 'group' ? 150 :320,
		closed: false,
		cache: false,
		modal: true,
		toolbar:null,
		content:ctx,
		onLoad:function(){},
		onClose:function(){
			$('#dsColumn_div').dialog('destroy');
		},
		buttons:[{
				text:'确定',
				handler:function(){
					if(right.attributes.tp == 'kpi'){
						right.attributes.aggre = $("#dsColumn_div #kpiaggre").val();
						right.attributes.fmt = $("#dsColumn_div #kpifmt").val();
						right.attributes.unit = $("#dsColumn_div #kpiunit").val();
						right.attributes.dispName = $("#dsColumn_div #kpiname").val();
						var note = $("#dsColumn_div #kpinote").val();
						note = escape(note);
						right.attributes.kpinote = note
						$("#cuberighttree").tree("update", {target:right.target, text: right.attributes.aggre+ "(" + right.attributes.dispName+")"})
					}else
					if(right.attributes.tp == 'dim'){
						var dtfmt = $("#dsColumn_div #dateformat").val();
						var dtp = $("#dsColumn_div #dimtype").val();
						if(dtp != "" && dtfmt == "" ){
							msginfo("请选择维度格式。", function(){
								$("#dsColumn_div #dateformat").select();
							});
							return;
						}
						right.attributes.dispName = $("#dsColumn_div #dimname").val();
						right.attributes.codetable = $("#dsColumn_div #codetable").val();
						right.attributes.keycol = $("#dsColumn_div #keycol").val();
						right.attributes.valcol = $("#dsColumn_div #valcol").val();
						right.attributes.dimtype = dtp;
						if(right.attributes.keycol == null){
							right.attributes.keycol = "";
						}
						if(right.attributes.valcol == null){
							right.attributes.valcol = "";
						}
						
						right.attributes.dateformat = dtfmt;
						$("#cuberighttree").tree("update", {target:right.target, text:$("#dsColumn_div #dimname").val()})
					}else if(right.attributes.tp == 'group'){
						right.attributes.dispName =  $("#dsColumn_div #groupname").val();
						right.attributes.grouptype =  $("#dsColumn_div #grouptype").val();
						$("#cuberighttree").tree("update", {target:right.target, text:$("#dsColumn_div #groupname").val()})
					}
					curTmpInfo.isupdate = true;
					$('#dsColumn_div').dialog('close');
				}
			},{
				text:'取消',
				handler:function(){
					$('#dsColumn_div').dialog('close');
				}
			}]
	});
	if(right.attributes.tp == 'dim'){
		//如果是维度，注册码表切换事件
		var codetableClick = function(val){
			if(val == ''){
				$("#dsColumn_div #keycol").html("");
				$("#dsColumn_div #valcol").html("");
			}else{
				//获取码表字段
				var dsource = findDatasourceById(dset.dsid);
				$.ajax({
					type:'post',
					url:'DataSet!queryMeta.action',
					dataType:'json',
					data:{"ds":JSON.stringify(dsource), "querysql":"select * from " + val + " where 1=2"},
					success: function(dt){
						var s = "";
						var s2 = "";
						for(k=0; k<dt.length; k++){
							s = s + "<option value=\""+dt[k].name+"\" "+(dt[k].name==right.attributes.keycol?"selected":"")+">"+dt[k].name+"</option>";
							s2 = s2 + "<option value=\""+dt[k].name+"\" "+(dt[k].name==right.attributes.valcol?"selected":"")+">"+dt[k].name+"</option>";
						}
						$("#dsColumn_div #keycol").html(s);
						$("#dsColumn_div #valcol").html(s2);
					}
				});
				curTmpInfo.isupdate = true;
			}
		}
		$("#dsColumn_div #codetable").bind("change", function(){
			var val = $(this).val();
			codetableClick(val);
		});
		var selVal = $("#dsColumn_div #codetable").val();
		if(selVal != ''){
			codetableClick(selVal);
		}
	}
}
function editcubecol2(tp, id, node){
	var colid = id;
	var cube = fundCubeById(node.attributes.cubeId);
	var dset = findDatasetById(cube.datasetid);
	var ctx = "";
	var atp = ["sum","avg","count", "max", "min"];
	
	if(tp == 'dim'){
		var dim = findCubeDimById(cube, id);
		//查询码表列表
		var tbs = "";
		for(i=0; i<dset.joininfo.length; i++){
			tbs = tbs + "<option value=\""+dset.joininfo[i].ref+"\" "+(dim.codetable == dset.joininfo[i].ref ? "selected":"")+">"+dset.joininfo[i].ref+"</option>";
		}
		var fmtstr = "<option value=\"\"></option>";
		for(i=0; i<dateformat.length; i++){
			fmtstr = fmtstr + "<option value=\""+dateformat[i]+"\" "+(dim.dateformat==dateformat[i]?"selected":"")+">"+dateformat[i]+"</option>";
		}
		ctx = "<div class=\"textpanel\"><span class=\"inputtext\">维度字段：</span>"+(dim.dyna?dim.col.replace(/@/g,"'"):dim.col)+"<br/><span class=\"inputtext\">显示名称：</span><input type=\"text\" id=\"dimname\" name=\"dimname\" class=\"inputform\" value=\""+dim.name+"\"><br/><span class=\"inputtext\">维度类型：</span><select id=\"dimtype\" name=\"dimtype\" class=\"inputform\"><option value=\"\"></option><option value=\"year\" "+(dim.dimtype=='year'?"selected":"")+">年</option><option value=\"quarter\" "+(dim.dimtype=='quarter'?"selected":"")+">季度</option><option value=\"month\" "+(dim.dimtype=='month'?"selected":"")+">月</option><option value=\"day\" "+(dim.dimtype=='day'?"selected":"")+">日</option></select><br/><span class=\"inputtext\">维度格式：</span><select id=\"dateformat\" class=\"inputform\">"+fmtstr+"</select><br/><span class=\"inputtext\">对应维表：</span><select id=\"codetable\" name=\"codetable\" class=\"inputform\"><option value=''></option>"+tbs+"</select><br/><span class=\"inputtext\">KEY字段：</span><select id=\"keycol\" name=\"keycol\" class=\"inputform\"></select><br/><span class=\"inputtext\">Text字段：</span><select id=\"valcol\" name=\"valcol\" class=\"inputform\"></select></div>";
	}else if(tp == 'kpi'){
		var kpi = findCubeKpiById(cube, id);
		var tpstr = "";
		for(i=0; i<atp.length; i++){
			tpstr = tpstr + "<option value=\""+atp[i]+"\" "+(atp[i] == kpi.aggre ? "selected":"")+">"+atp[i]+"</option>";
		}
		//查询已选指标
		var kpiStr = "";
		var ls = cube.kpi;
		for(i=0; i<ls.length; i++){
			var k = ls[i];
			if(k.calc != true){
				kpiStr = kpiStr + "<span name=\""+k.col+"\", aggre=\""+k.aggre+"\" class=\"column\">"+ k.name+"</span> ";
			}
		}
		ctx = "<div class=\"textpanel\">"+(!kpi.calc?"<span class=\"inputtext\">度量字段：</span>"+(kpi.dyna?kpi.col.replace(/@/g,"'"):kpi.col)+"<br/>":"")+"<span class=\"inputtext\">显示名称：</span><input type=\"text\" id=\"kpiname\" name=\"kpiname\" class=\"inputform\" value=\""+kpi.name+"\"><br/>"+(!kpi.calc?"<span class=\"inputtext\">来源表：</span>"+kpi.tname+"<br/>":"") + (kpi.calc?"<table cellspacing=\"0\" cellpadding=\"0\"><tbody><tr><td valign=\"top\"><span class=\"inputtext\">表 达 式：</span></td><td><textarea rows=\"2\" style=\"height:52px;\" cols=\"45\" id=\"expression\" name=\"expression\">"+(kpi.col?kpi.col:"")+"</textarea></td></tr></tbody></table><div class=\"actColumn\">"+kpiStr+"</div>":"")
		+ "<span class=\"inputtext\">计算方式：</span><select id=\"kpiaggre\" name=\"kpiaggre\" class=\"inputform\">"+tpstr+"</select> <br>"
		+ "<span class=\"inputtext\">度量单位：</span><input type=\"text\" id=\"kpiunit\" name=\"kpiunit\" class=\"inputform\" value=\""+(kpi.unit?kpi.unit:"")+"\"> <br>"
		+ "<span class=\"inputtext\">格式化：</span>" + ftmstr("kpifmt","inputform",kpi.fmt?kpi.fmt:"") + "<br/><span class=\"inputtext\">指标解释：</span><textarea name=\"kpinote\" id=\"kpinote\"  cols=\"25\" style=\"height:32px;\" rows=\"2\">"+(kpi.kpinote?unescape(kpi.kpinote):"")+"</textarea></div>";
	}else if(tp == 'group'){
		var group = findCubeGroupById(cube, id);
		ctx = "<div class=\"textpanel\"><span class=\"inputtext\">分组名称：</span><input type=\"text\" id=\"groupname\" name=\"groupname\" value=\""+group.name+"\" class=\"inputform\"><br/><span class=\"inputtext\">分组类型：</span><select id=\"grouptype\" name=\"grouptype\" class=\"inputform\"><option value=\"\"></option><option value=\"date\" "+(group.grouptype=="date"?"selected":"")+">时间</option></select></div>";
	}
	if($("#dsColumn_div").size() == 0){
		$("<div id=\"dsColumn_div\" class=\"easyui-menu\"></div>").appendTo("body");
	}
	var w = 350;
	if(tp == 'kpi'){
		w =  420;
	}
	var h = 300;
	if(tp == 'group'){
		h = 150;
	}else if(tp == 'kpi'){
		h =  360;
	}
	$('#dsColumn_div').dialog({
		title: tp == 'group' ? "编辑分组" : "编辑度量及维度",
		width: w,
		height: h,
		closed: false,
		cache: false,
		modal: true,
		toolbar:null,
		content:ctx,
		onLoad:function(){},
		onClose:function(){
			$('#dsColumn_div').dialog('destroy');
		},
		buttons:[{
				text:'确定',
				handler:function(){
					if(tp == 'kpi'){
						var kpi = findCubeKpiById(cube, id);
						kpi.aggre = $("#dsColumn_div #kpiaggre").val();
						kpi.fmt = $("#dsColumn_div #kpifmt").val();
						kpi.unit = $("#dsColumn_div #kpiunit").val();
						kpi.name = $("#dsColumn_div #kpiname").val();
						var kpinote = $("#dsColumn_div #kpinote").val();
						kpi.kpinote = escape(kpinote);
						if(kpi.calc){
							kpi.col =  $("#dsColumn_div #expression").val();
						}
						$("#mydatatree").tree("update", {target:node.target, text: kpi.aggre+ "(" + kpi.name+")"})
					}else
					if(tp == 'dim'){
						var dim = findCubeDimById(cube, id);
						var dtfmt = $("#dsColumn_div #dateformat").val();
						var dtp = $("#dsColumn_div #dimtype").val();
						if(dtp != "" && dtfmt == "" ){
							msginfo("请选择维度格式。", function(){
								$("#dsColumn_div #dateformat").select();
							});
							return;
						}
						dim.name = $("#dsColumn_div #dimname").val();
						dim.codetable = $("#dsColumn_div #codetable").val();
						dim.keycol = $("#dsColumn_div #keycol").val();
						dim.valcol = $("#dsColumn_div #valcol").val();
						dim.dimtype = dtp;
						if(dim.keycol == null){
							dim.keycol = "";
						}
						if(dim.valcol == null){
							dim.valcol = "";
						}
						dim.dateformat = dtfmt;
						
						$("#mydatatree").tree("update", {target:node.target, text:$("#dsColumn_div #dimname").val()})
					}else if(tp == 'group'){
						var group = findCubeGroupById(cube, id);
						group.name =  $("#dsColumn_div #groupname").val();
						group.grouptype = $("#dsColumn_div #grouptype").val();
						$("#mydatatree").tree("update", {target:node.target, text:$("#dsColumn_div #groupname").val()})
					}
					initselectDataTree();
					curTmpInfo.isupdate = true;
					$('#dsColumn_div').dialog('close');
				}
			},{
				text:'取消',
				handler:function(){
					$('#dsColumn_div').dialog('close');
				}
			}]
	});
	if(tp == 'kpi'){
		//注册选指标点击事件
		$("#dsColumn_div .actColumn .column").bind("click", function(){
			var txt = $(this).attr("name");
			var aggre = $(this).attr("aggre");
			insertText2focus(document.getElementById("expression"), aggre+"(" + txt + ") ");
		});
	}
	if(tp == 'dim'){
		//如果是维度，注册码表切换事件
		var codetableClick = function(val){
			if(val == ''){
				$("#dsColumn_div #keycol").html("");
				$("#dsColumn_div #valcol").html("");
			}else{
				//获取码表字段
				var dsource = findDatasourceById(dset.dsid);
				$.ajax({
					type:'post',
					url:'DataSet!queryMeta.action',
					dataType:'json',
					data:{"ds":JSON.stringify(dsource), "querysql":"select * from " + val + " where 1=2"},
					success: function(dt){
						var s = "";
						var s2 = "";
						for(k=0; k<dt.length; k++){
							s = s + "<option value=\""+dt[k].name+"\" "+(dt[k].name==dim.keycol?"selected":"")+">"+dt[k].name+"</option>";
							s2 = s2 + "<option value=\""+dt[k].name+"\" "+(dt[k].name==dim.valcol?"selected":"")+">"+dt[k].name+"</option>";
						}
						$("#dsColumn_div #keycol").html(s);
						$("#dsColumn_div #valcol").html(s2);
					}
				});
			}
		}
		$("#dsColumn_div #codetable").bind("change", function(){
			var val = $(this).val();
			codetableClick(val);
		});
		var selVal = $("#dsColumn_div #codetable").val();
		if(selVal != ''){
			codetableClick(selVal);
		}
	}
}
function findCubeMaxId(target){
	var ret = 0;
	var ls = $("#cuberighttree").tree("getChildren", target);
	for(i=0; i<ls.length; i++){
		if(Number(ls[i].id) > ret){
			ret = Number(ls[i].id);
		}
	}
	return ret + 1;
}
function ds2cube(){
	var left = $("#cubelefttree").tree("getSelected");
	if(left == null){
		msginfo('您还未从左边选择字段。');
		return;
	}
	if($(left.target).attr("hide") == 'y'){
		return;
	}
	var right = $("#cuberighttree").tree("getSelected");
	if(right == null){
		msginfo("您还未选择右边度量或维度。");
		return;
	}
	var parent = $("#cuberighttree").tree("getParent", right.target);
	if(right.text == '度量' || parent.text == '度量'){
		//生成ID
		var cid = findCubeMaxId($("#cuberighttree  div[node-id='cubedl']"));
		var o = {id:cid, text:'sum('+left.text+")",attributes:{tp:"kpi",drag:true,aggre:"sum",col:left.attributes.col, dispName:left.text,tname:left.attributes.tname,dyna:left.attributes.dyna},iconCls:"icon-kpi"};
		if(right.text == '度量'){
			$("#cuberighttree").tree("append",  {parent:right.target,data:o});
		}else{
			$("#cuberighttree").tree("insert",  {after:right.target,data:o});
		}
		$(left.target).attr("hide", "y").hide();
	}else if(right.text == '维度' || parent.text == '维度' || parent.attributes.tp == 'group'){
		var cid = findCubeMaxId($("#cuberighttree  div[node-id='cubewd']"));
		var o = {id:cid, text:left.text, attributes:{tp:"dim",drag:true,col:left.attributes.col,dispName:left.text,tname:left.attributes.tname,vtype:left.attributes.vtype,dyna:left.attributes.dyna, refId:left.id},iconCls:"icon-dim"};
		if(right.text == '维度' || (parent.text == '维度' && right.attributes.tp == 'group')){
			$("#cuberighttree").tree("append",  {parent:right.target,data:o});
		}else{
			$("#cuberighttree").tree("insert",  {after:right.target,data:o});
		}
		$(left.target).attr("hide", "y").hide();
	}
	curTmpInfo.isupdate = true;
}
function cube2ds(){
	var right = $("#cuberighttree").tree("getSelected");
	if(right == null || !right.attributes){
		msginfo("您还未选择需要删除的度量或维度。");
		return;
	}
	if(right.attributes.tp == 'group'){
		if($("#cubelefttree").tree("getChildren", right.target).length > 0){
			msginfo("您要删除的分组含有维度，不能删除。");
			return;
		}
	}
	if(right.attributes.tp != 'group'){ //分组删除不用关联左边树
		var id = right.attributes.refId?right.attributes.refId:right.attributes.col;   //通过 refId 引用s数据集的字段ID
		var tname = right.attributes.tname;
		var root = $("#cubelefttree").tree("getRoot");
		var cld = $("#cubelefttree").tree("getChildren", root.target);
		for(i=0; i<cld.length; i++){
			if(cld[i].id == id && cld[i].attributes && cld[i].attributes.tname == tname){
				$(cld[i].target).attr("hide", "n").show();
				break;
			}
		}
	}
	$("#cuberighttree").tree("remove", right.target);
	curTmpInfo.isupdate = true;
}
//生成唯一标识
function newGuid()
{
    var guid = "";
    for (var i = 1; i <= 32; i++){
      var n = Math.floor(Math.random()*16.0).toString(16);
      guid +=   n;
      //if((i==8)||(i==12)||(i==16)||(i==20))
      //  guid += "-";
    }
    return guid;    
}
function encoder(str, tp){
	var str1 =  ["a", "b", "c", "d", "e", "f", "g", "h",
			"i", "j", "k", "l", "m", "n", "o", "p", "q", "r", "s", "t", "u",
			"v", "w", "x", "y", "z", "A", "B", "C", "D", "E", "F", "G", "H",
			"I", "J", "K", "L", "M", "N", "O", "P", "Q", "R", "S", "T", "U",
			"V", "W", "X", "Y", "Z", "1", "2", "3", "4", "5", "6", "7", "8",
			"9", "0", ".", "-", "*", "/", "'", ":", ";", ">", "<", "~", "!",
			"@", "#", "$", "%", "^", "&", "(", ")", "{", "}", "[", "]", "|", "_"];
	var str2 = ["T","l","m",">","S","&","J","G","/","!","p","h","Z","7","q","_","U","(","0","a","X","f","^","@","D","~","M","t","O","6","9","C","N","K","H","g","w","4","F","<","e","2","R","o","$","d","V","v","]","#","[","L","r","b","Y","{","z","k","x","n","5","B","W","-","A","P","1","j","E","u","s","'","I","c","%",".","i","y","Q","*",")","3","8","}",";",":","|"];
	var findPos = function(s, arr){
		var pos = -1;
		for(var i=0; i<arr.length; i++){
			if(s == arr[i]){
				pos = i;
				break;
			}
		}
		return pos;
	}
	var ret = "";
	if(tp == "encode"){
		for(var j=0; j<str.length; j++){
			var c = str.charAt(j);
			ret = ret + str2[findPos(c, str1)];
		}
	}else if(tp == "decode"){
		for(var j=0; j<str.length; j++){
			var c = str.charAt(j);
			ret = ret + str1[findPos(c, str2)];
		}
	}
	return ret;
}
function ftmstr(id, cls, curfmt){
	var str = "<select id=\""+id+"\" name=\""+id+"\" class=\""+cls+"\">";
	str = str + "<option value=\"\"></option><option "+(curfmt=='#,###'?"selected":"")+" value=\"#,###\">整数</option><option "+(curfmt=='#,###.00'?"selected":"")+" value=\"#,###.00\">小数</option><option "+(curfmt=='0.00%'?"selected":"")+" value=\"0.00%\">百分比</option>";
	str = str + "</select>";
	return str;
}
function findDatasourceById(dsourceId){
	var dsobj = null;
	for(i=0;i<pageInfo.datasource.length;i++){
		if(pageInfo.datasource[i].dsid == dsourceId){
			dsobj = pageInfo.datasource[i];
		}
	}
	return dsobj;
}
function findDatasetById(dsetId){
	var ret = null;
	for(var i=0; i<pageInfo.dataset.length; i++){
		var d = pageInfo.dataset[i];
		if(d.datasetid == dsetId){
			ret = d;
			break;
		}
	}
	return ret;
}
function fundCubeById(cubeId){
	var ret = null;
	for(var i=0; i<pageInfo.cube.length; i++){
		var d = pageInfo.cube[i];
		if(d.id == cubeId){
			ret = d;
			break;
		}
	}
	return ret;
}
/**
retIdx 表示返回数组下标而不是目标对象
**/
function findCubeKpiById(cube, kpiId, retIdx){
	var ret = null;
	var index = -1;
	if(!cube.kpi || cube.kpi.length == 0){
		if(retIdx == true){
			return index;
		}else{
			return ret;
		}
	}
	for(var i=0; i<cube.kpi.length; i++){
		var d = cube.kpi[i];
		if(d.id == kpiId){
			ret = d;
			index = i;
			break;
		}
	}
	if(retIdx == true){
		return index;
	}else{
		return ret;
	}
}
function findCubeDimById(cube, dimId){
	var ret = null;
	if(!cube.dim || cube.dim.length == 0){
		return ret;
	}
	for(var i=0; i<cube.dim.length; i++){
		var d = cube.dim[i];
		if(d.tp == 'dim'){
			if(d.id == dimId){
				ret = d;
				break;
			}
		}else if(d.tp == 'group'){
			for(var j=0; j<d.children.length; j++){
				if(d.children[j].id == dimId){
					ret = d.children[j];
					break;
				}
			}
		}
	}
	return ret;
}
function findCubeGroupById(cube, groupId, retIdx){
	var ret = null;
	var index = -1;
	if(!cube.dim || cube.dim.length == 0){
		if(retIdx == true){
			return index;
		}else{
			return ret;
		}
	}
	for(var i=0; i<cube.dim.length; i++){
		var d = cube.dim[i];
		if(d.tp == 'group'){
			if(d.id == groupId){
				ret = d;
				index = i;
				break;
			}
		}
	}
	if(retIdx == true){
		return index;
	}else{
		return ret;
	}
}
//在textarea光标处插入文本
function insertText2focus(obj,str) {
	obj.focus();
	if (document.selection) {
		var sel = document.selection.createRange();
		sel.text = str;
	} else if (typeof obj.selectionStart == 'number' && typeof obj.selectionEnd == 'number') {
		var startPos = obj.selectionStart,
			endPos = obj.selectionEnd,
			cursorPos = startPos,
			tmpStr = obj.value;
		obj.value = tmpStr.substring(0, startPos) + " " + str + tmpStr.substring(endPos, tmpStr.length);
		cursorPos += str.length;
		obj.selectionStart = obj.selectionEnd = cursorPos;
	} else {
		obj.value += str;
	}
}