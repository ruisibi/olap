if($ == undefined){
	$ = jQuery;
}
var dataType = ["String", "Int", "Double", "Date"];
function initselectDataTree(){
	var existDt = false;
	if(pageInfo.selectDs && pageInfo.selectDs!=''){
		var dsets = pageInfo.selectDs.split(",");
		var dt = [];
		for(i=0;i<dsets.length;i++){
			var dset = findDatasetById(dsets[i]);
			if(dset == null){ //当前数据集已经被删除了
				continue;
			}
			existDt = true;
			var o = {id:dset.datasetid, text:dset.name, iconCls:'icon-dataset2', attributes:{drag:'n'}, children:[]};
			dt.push(o);
			for(j=0; j<dset.cols.length; j++){
				var c = dset.cols[j];
				if(c.isshow){
					o.children.push({id:c.tname+"_"+c.name, text:(c.dispName==""?c.name:c.dispName), iconCls:'icon-dscol', attributes:{name:c.name,tname:c.tname,type:c.type, dispName:c.dispName, tid:dset.datasetid,fmt:c.fmt}});
				}
			}
			//添加动态字段
			for(k=0; dset.dynamic&&k<dset.dynamic.length; k++){
				var d = dset.dynamic[k];
				o.children.push({id:d.tname+"_" + d.name, text:(d.dispName!=""?d.dispName:d.name), iconCls:'icon-dscol', attributes:{name:d.name, tname:d.tname, type:d.type, dispName:d.dispName, tid:dset.datasetid,expression:d.expression,fmt:d.fmt}});
			}
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
				msginfo("拖拽字段到明细表进行数据查询。","info");
				e.preventDefault();
			}
		});
	}
	if(!existDt)
	{
		$("#selectdatatree").tree({
			dnd:false,
			data:[{id:'nodata', text:'您还未选择查询的数据集。', iconCls:'icon-no'}]
		});
	}
}
function selectdset(){
	var ctx = "<table class=\"grid3\" id=\"T_report54\" cellpadding=\"0\" cellspacing=\"0\">" + 
		"<tr style=\"background-color:#FFF\">" + 
		"<th width=\"10%\">选择</th><th width=\"10%\">序号</th><th width=\"40%\">数据集名称</th><th width=\"40%\">数据集说明</th></tr>";
	for(i=0; pageInfo.dataset && i<pageInfo.dataset.length; i++){
		var o = pageInfo.dataset[i];
		ctx = ctx + "<tr><td class='kpiData1 grid3-td'><input type=\"checkbox\" id=\"selectdataset\" name=\"selectdataset\" value=\""+o.datasetid+"\" /></td><td class='kpiData1 grid3-td'>"+(i + 1)+"</td><td class='kpiData1 grid3-td'>"+o.name+"</td><td class='kpiData1 grid3-td'>"+o.note+"</td></tr>";
	}
	if(!pageInfo.dataset || pageInfo.dataset.length == 0){
		ctx = ctx + "<tr><td class='kpiData1 grid3-td' align='center' colspan=\"4\">无数据，请先建立数据模型。</td></tr>";
	}
	ctx = ctx + "</table>";
	$('#pdailog').dialog({
		title: '选择查询数据',
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
				var tp = curTmpInfo.tp = node.attributes.type;
				curTmpInfo.id = node.id;
				if(tp == "dsettable"){
					msginfo("请在数据集上右键编辑数据集。");
					return;
				}
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
	var ctx = "<div id=\"crtdataset\" class=\"easyui-tabs\" data-options=\"fit:true,border:false,tabPosition:'left'\"><div title=\"基本信息\"><div class=\"textpanel\"><span class=\"inputtext\">数据集名称：</span><input type=\"text\" id=\"datasetname\" name=\"datasetname\" class=\"inputform\"><br/><span class=\"inputtext\">数据集说明：</span><input type=\"text\" id=\"datasetnote\" name=\"datasetnote\" class=\"inputform\"><br/><span class=\"inputtext\">连接数据源：</span>"+sel+"<br/><span class=\"inputtext\" style=\"width:120px;\">选择需要分析的表：</span><br/><div class=\"tablesleft\"><div class=\"tabletitle\">待选表</div><ul id=\"allTablesTree\" style=\"height:220px; width:100%; overflow:auto\"></ul></div><div class=\"tablescenter\"><input id=\"left2right\" type=\"button\" style=\"margin-top:120px;\" value=\">\" title=\"选择\"><br/><input type=\"button\" id=\"right2left\"  value=\"<\" title=\"移除\"></div><div class=\"tablesright\"><div class=\"tabletitle\">已选表</div><ul id=\"selTablesTree\" class=\"easyui-tree\" style=\"height:220px; width:100%; overflow:auto\"></ul></div></div></div><div title=\"表关联\"><div class=\"textpanel\"><div style=\"float:right\"><input type=\"button\" id=\"jointable\" value=\"关联\"> <br/> <input type=\"button\" id=\"unjointable\" value=\"取消\"></div><span class=\"inputtext\">主表： </span><select id=\"mastertable\" style=\"width:300px;\"></select><br/><ul class=\"easyui-tree\" id=\"masterTableTree\" style=\"margin-left:90px;border:1px solid #999; width:300px; height:320px; overflow:auto\"></ul></div></div></div>";
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
					var datasetnote = $("#pdailog #datasetnote").val();
					
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
					
					var obj = {"name":name, "note":datasetnote,"dsid":dsid, "datasetid":newGuid()};
					//构建表连接信息
					obj.master = $("#mastertable").val();
					var ls = $("#masterTableTree").tree("getChildren");
					var joininfo = [];
					for(i=0; i<ls.length; i++){
						var child = ls[i];
						if(child.iconCls == 'icon-coljoin'){
							joininfo.push({col:child.id,  ref:child.attributes.ref, refKey:child.attributes.refKey});
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
							$("#mydatatree").tree("expand", $("#mydatatree div[node-id='sjj']"));
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
		rett.push({id:tn, text:tn, iconCls:'icon-table',state:'open',children:child, attributes:{showmenu:true, drag:'n',type:'dsettable'}});
		for(k=0; k<colls.length; k++){
			var o = colls[k];
			child.push({id:o.name, text:(o.dispName==""?o.name:o.dispName), iconCls:'icon-dscol', attributes:{showmenu:true,drag:'n',vtype:o.type,tname:o.tname,isshow:o.isshow,datasetid:datasetid, type:'dsetcol'}});
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
	
	var ctx = "<div class=\"textpanel\">主表 <b>"+$("#mastertable").val()+"</b> 字段 <b>"+node.id+"</b> <br/> &nbsp; &nbsp; &nbsp; =>关联到=> <br/> 从表 <select id=\"slavetable\" style=\"width:150px;\">"+tbs+"</select> 字段 <select id=\"slavetablecol\"  style=\"width:100px;\">"+getSlaveColumns(tname)+"</select> </div>";
	$('#dsColumn_div').dialog({
		title: "关联维度表",
		width: 350,
		height: 200,
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
function editdataset(){
	var id = curTmpInfo.id;
	var dset = findDatasetById(id);
	//复制一份dset用来编辑
	dset = eval("("+JSON.stringify(dset)+")");
	curTmpInfo.curDset = dset;
	var dsource = findDatasourceById(dset.dsid);
	$('#pdailog').dialog({
		title: '编辑数据集',
		width: 800,
		height: 450,
		closed: false,
		cache: false,
		modal: true,
		toolbar:null,
		content:'<div id="datasettabs" ><div title="基本信息" ><div class="textpanel"><span class="inputtext">数据集名称：</span><input type="text" class="inputform" name="datasetname" id="datasetname" value="'+dset.name+'"><br/><span class="inputtext">数据集说明：</span><input type="text" class="inputform" name="datasetnote" id="datasetnote" value="'+(dset.note?dset.note:"")+'"><br/><span class="inputtext">连接数据源：</span><input type="text" class="inputform" value="'+(dsource.use=='jndi'?dsource.jndiname:dsource.dsname)+'" readOnly=true>(不能更改)<br/><span class="inputtext">已选分析表：</span><br/><table width="100%" border="0" cellspacing="0" cellpadding="0"><tr><td width="70%" valign="top"><ul id=\"selectTables\"></ul></td><td valign="top" align="right"><a id=\"addtable\" href=\"#\">添加表</a><br/><a id=\"deltable\" href=\"#\">删除表</a></td></tr></table></div></div><div title="表关联" ><div class="textpanel"><div style="float:right"><input type="button" value="关联" id="jointable"><br/><input type="button" value="删除" id="deljointable"></div><span class="inputtext">主表： </span><input type="text" class="inputform" value="'+dset.master+'" style="width:300px;">(不可更改)<br/><ul id="masterTableTree" style="margin-left:90px;border:1px solid #999; width:300px; height:320px; overflow:auto"></ul></div></div><div title="字段信息"></div><div title="动态字段"></div><div title="数据筛选"></div><div title="数据预览"></div></div>',
		onLoad:function(){
		},
		buttons:[{
				text:'确定',
				handler:function(){
					//dset.dsid = $("#dsid").val();
					dset.name = $("#datasetname").val();
					dset.note = $("#datasetnote").val();
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
					var o = dset.cols;
					ncols = initdatasetview(o, dset.datasetid);
					$("#mydatatree").tree("append", {parent:pp.target, data: ncols});
					$("#mydatatree").tree("update", {target:pp.target, text: dset.name});
					
					//更新已选数据
					initselectDataTree();
					
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
			if(cld[i].col != ''){
				continue;   //只关联新添加的表 
			}
			tbs = tbs + "<option value=\""+cld[i].ref+"\">"+cld[i].ref+"</option>";
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
						slavecols = slavecols + "<option value=\""+ dt[k].name+"\">" + dt[k].name + "</option>";
					}
				}
			});
			return slavecols;
		};
		
		var ctx = "<div class=\"textpanel\">主表 <b>"+dset.master+"</b> 字段 <b>"+node.id+"</b> <br/> &nbsp; &nbsp; &nbsp; =>关联到=> <br/> 从表 <select id=\"slavetable\" style=\"width:150px;\">"+tbs+"</select> 字段 <select id=\"slavetablecol\"  style=\"width:100px;\"></select> </div>";
		$('#dsColumn_div').dialog({
			title: "关联维度表",
			width: 350,
			height: 200,
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
						if(!ref || ref == null || ref == ""){
							msginfo("请选择关联表。");
							return;
						}
						var joininfo = null;
						for(i=0; i<dset.joininfo.length; i++){
							if(dset.joininfo[i].ref == ref){
								joininfo = dset.joininfo[i];
								break;
							}
						}
						joininfo.col = node.id;
						joininfo.refKey = refkey;
						$("#masterTableTree").tree("update", {target:node.target, text:node.text + " -> " + ref + "." + refkey, iconCls:"icon-coljoin"});
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
	
	$("#datasettabs").tabs({border:false,fit:true,tabPosition:"left","plain":false, onLoad:function(){
	},
	onSelect:function(a, b){
		if(b == 1){
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
						mcols.push({id:dset.cols[i].name,text:dset.cols[i].name+" -> "+r.ref + '.' + r.refKey, iconCls:'icon-coljoin', attributes:{ref:r.ref}});
					}
				}
			}
			$("#masterTableTree").tree({
				data:mcols
			});
		}
		if(b == 2){
			var pp = $('#datasettabs').tabs('getSelected');
			var str = "<table class=\"grid3\" id=\"T_report54\" cellpadding=\"0\" cellspacing=\"0\">";
			str = str + "<tr><th width=\"15%\">字段名</th><th width=\"15%\">显示名</th><th width=\"15%\">类型</th><th width=\"15%\">格式化</th><th width=\"10%\">是否显示</th><th width=\"15%\">来源表</th><th width=\"8%\">操作</th></tr>";
			for(var i=0; i<dset.cols.length; i++){
				m = dset.cols[i];
				str = str + "<tr><td class='kpiData1 grid3-td' style='"+(!m.isshow?"text-decoration:line-through":"")+"'>"+m.name+"</td><td class='kpiData1 grid3-td'><div id=\""+m.tname+"_"+m.name+"_disp\">"+(m.dispName == '' ? "&nbsp;":m.dispName)+"</div></td><td class='kpiData1 grid3-td'><div id=\""+m.tname+"_"+m.name+"_tp\">"+m.type+"</div></td><td class=\"kpiData1 grid3-td\"><div id=\""+(m.tname+"_"+m.name+"_fmt")+"\">"+(m.fmt?m.fmt:"")+"</div></td><td class='kpiData1 grid3-td' align=\"center\"><div id=\""+m.tname+"_" + m.name+ "_show"+"\">"+(m.isshow?"是":"否")+"</div></td><td class='kpiData1 grid3-td'>"+m.tname+"</td><td class='kpiData1 grid3-td' align='center'><a href=\"javascript:;\" onclick=\"editDsColumn('"+m.name+"', '"+curTmpInfo.id+"', '"+m.tname+"', 'panel')\">编辑</a></td></tr>";
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
function newdatactx(){
	var id = curTmpInfo.id;
	if(id == "sjy"){
		newdatasource(false);
	}else if(id == "sjj"){
		newdataset();
	}
}
function editmydata(){
	var tp = curTmpInfo.tp;
	var id = curTmpInfo.id;
	if(tp == 'dsource'){
		newdatasource(true);
	}else if(tp == 'dset'){
		editdataset();
	}else if(tp == "dsettable"){ //选中了dataset 的表名, 提示选择数据集
		//
		msginfo("请在数据集上右键编辑数据集。");
	}else if(tp == 'dsetcol'){
		var node = $("#mydatatree").tree("getSelected");
		editDsColumn(node.id, node.attributes.datasetid, node.attributes.tname, 'col');
	}
}
function deletemydata(){
	if(confirm("是否确认删除？") == false){
		return;
	}
	var tp = curTmpInfo.tp;
	var id = curTmpInfo.id;
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
	curTmpInfo.isupdate = true;
}
function editDsColumn(colId, datasetid, tname, income){
	if($("#dsColumn_div").size() == 0){
		$("<div id=\"dsColumn_div\" class=\"easyui-menu\"></div>").appendTo("body");
	}
	var dset = income == 'panel' ? curTmpInfo.curDset : findDatasetById(datasetid);
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
	var ctx = "<div class=\"textpanel\"><span class=\"inputtext\">字段名：</span>"+tmp.name+"<br/><span class=\"inputtext\">显示名：</span><input type=\"text\" name=\"coldispname\" id=\"coldispname\" value=\""+tmp.dispName+"\" class=\"inputform\"><br/><span class=\"inputtext\">类型：</span><select id=\"coltype\" class=\"inputform\">"+tps+"</select><br/><span class=\"inputtext\">是否显示：</span><select id=\"isshow\" class=\"inputform\"><option value=\"1\" "+(tmp.isshow==true?"selected":"")+">是</option><option value=\"0\" "+(tmp.isshow==false?"selected":"")+">否</option></select><br/><span class=\"inputtext\">格式化：</span><input type='text' style='width:80px;' id='fmt' value=\""+(tmp.fmt?tmp.fmt:"")+"\"> (yyyy-MM-dd 或 #,###等)<br/><span class=\"inputtext\">来源表：</span>"+tmp.tname+"<br/><span class=\"inputtext\">字段关联：</span>"+(joinInfo==null?"字段无关联":dset.master+"."+joinInfo.col+" -> " + joinInfo.ref+"."+joinInfo.refKey)+"</div>";
	$('#dsColumn_div').dialog({
		title: '编辑字段信息',
		width: joinInfo == null ? 350 : 420,
		height: 300,
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
					var is_show = $("#dsColumn_div #isshow").val();
					tmp.isshow = Number(is_show) == 1 ? true : false;
					tmp.fmt = $("#dsColumn_div #fmt").val();
					curTmpInfo.isupdate = true;
					if(income == 'panel'){
						//回写值
						$("#datasettabs #"+tmp.tname+"_"+tmp.name+"_disp").text(tmp.dispName);
						$("#datasettabs #"+tmp.tname+"_"+tmp.name+"_tp").text(tmp.type);
						$("#datasettabs #"+tmp.tname+"_"+tmp.name+"_show").text(tmp.isshow?"是":"否");
						$("#datasettabs #"+tmp.tname+"_"+tmp.name+"_fmt").text(tmp.fmt);
						$("#datasettabs #"+tmp.tname+"_"+tmp.name+"_show").parents("tr").find("td:first").css("text-decoration",tmp.isshow?"none":"line-through");
					}else if(income == 'col'){
						var node = $("#mydatatree").tree("getSelected");
						$("#mydatatree").tree("update", {target:node.target, text:(tmp.dispName==''?tmp.name:tmp.dispName)});
						initselectDataTree(); //更新已选数据
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
	str = str + "<tr><th width=\"15%\">字段名</th><th width=\"15%\">显示名</th><th width=\"30%\">表达式</th><th width=\"15%\">值类型</th><th width=\"12%\">格式化</th><th width=\"12%\">操作</th></tr>";
			
	for(var i=0; dataset.dynamic && i<dataset.dynamic.length; i++){
		var o = dataset.dynamic[i];
		str = str + "<tr><td class=\"kpiData1 grid3-td\">"+o.name+"</td><td class=\"kpiData1 grid3-td\">"+o.dispName+"</td><td class=\"kpiData1 grid3-td\">"+o.expression.replace(/@/g,"'")+"</td><td class=\"kpiData1 grid3-td\">"+o.type+"</td><td class=\"kpiData1 grid3-td\">"+(o.fmt?o.fmt:"")+"</td><td class=\"kpiData1 grid3-td\"><a href=\"javascript:;\" col=\""+o.name+"\" id=\"dynamiccolupdate\">编辑</a> <a href=\"javascript:;\" col=\""+o.name+"\" id=\"dynamiccoldel\">删除</a></td></tr>";
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
		var ctx = "<div class=\"textpanel\"><span class=\"inputtext\">字段名：</span><input type=\"text\" id=\"colname\" name=\"colname\" class=\"inputform\" value=\""+(ccol?ccol.name:"")+"\">(添加后不能更改)<br/><span class=\"inputtext\">显示名：</span><input type=\"text\" id=\"dispname\" name=\"dispname\" class=\"inputform\" value=\""+(ccol?ccol.dispName:"")+"\"><br/><table cellspacing=\"0\" cellpadding=\"0\"><tbody><tr><td valign=\"top\"><span class=\"inputtext\">表 达 式：</span></td><td><textarea name=\"expression\" id=\"expression\" cols=\"40\" style=\"height:52px;\">"+(ccol?ccol.expression.replace(/@/g,"'"):"")+"</textarea></td></tr></tbody></table><span class=\"inputtext\">值类型：</span><select id=\"valtype\" class=\"inputform\">"+tps+"</select><br/><span class=\"inputtext\">格式化</span><input type=\"text\" id=\"fmt\" value=\""+(ccol&&ccol.fmt?ccol.fmt:"")+"\" size=\"10\"> (只对Int/Double类型起作用)</div>";
		if($("#dsColumn_div").size() == 0){
			$("<div id=\"dsColumn_div\" class=\"easyui-menu\"></div>").appendTo("body");
		}
		$('#dsColumn_div').dialog({
			title: ccol ? '编辑动态字段' : '添加动态字段',
			width: 380,
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
						if(ccol){
							ccol.dispName = $("#dsColumn_div #dispname").val();
							ccol.name = $("#dsColumn_div #colname").val();
							ccol.type = $("#dsColumn_div #valtype").val();
							ccol.expression = $("#dsColumn_div #expression").val().replace(/'/g,"@");
							ccol.fmt = $("#dsColumn_div #fmt").val();
						}else{
							var obj = {dispName:$("#dsColumn_div #dispname").val(),name:$("#dsColumn_div #colname").val(),tname:dataset.master,type:$("#dsColumn_div #valtype").val(),expression:$("#dsColumn_div #expression").val().replace(/'/g,"@"), fmt:$("#dsColumn_div #fmt").val()};
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
	for(i=0; i<dset.cols.length; i++){
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