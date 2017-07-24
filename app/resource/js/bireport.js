if($ == undefined){
	$ = jQuery;
}
function initpage(){
	//初始化TAB信息
	$("#l_tab").tabs({fit:true,border:false});
	
	//初始化我的报表
	loadMyReportTree();
	
	//初始化视图
	initviewTree();
	
	//初始化selectdatatree
	initselectDataTree();
	
	//初始化参数
	initparam();
	
	//初始化默认组件
	for(i=0;i<pageInfo.comps.length; i++){
		var t = pageInfo.comps[i];
		var str = t.type == 'text' ? t.text.replace(/\n/g,"<br>") : null;
		addComp(t.id, t.name, str, false, t.type, isnewpage ? null : t);
	}
	//初始化datatree(数据中心)
	initmydatatree();
}

//view 表示当前是 view 状态
function newpage(view){
	var url = view?"ReportDesign!view.action":"ReportDesign.action";
	if(curTmpInfo.isupdate == true){
		if(confirm('页面还未保存\n是否保存当前页面？')){
			savepage(view,function(){
				location.href = url;
			});
		}else{
			location.href = url;
		}
	}else{
		location.href = url;
	}
}

function insertTable(){
	addComp(getMaxCompId(), "表格组件", null, true, 'table');
}
function initparam(){
	//回写参数值
	if(pageInfo.params && pageInfo.params.length>0){
		$("#p_param div.ptabhelpr").remove();
		$("#p_param").append("<b>参数： </b>");
		for(i=0; i<pageInfo.params.length; i++){
			var obj = $("#p_param");
			var str = "<span class=\"pppp\" id=\"pa_"+pageInfo.params[i].id+"\"><span title=\"筛选\" onclick=\"paramFilter('"+pageInfo.params[i].id+"', '"+pageInfo.params[i].type+"', '"+pageInfo.params[i].name+"')\" class=\"text\">"+pageInfo.params[i].name+"(";
			//if(pageInfo.params[i].type == 'frd'){
				str = str  + (!pageInfo.params[i].valStrs || pageInfo.params[i].valStrs == ''?"无":pageInfo.params[i].valStrs);
			//}else {
				//str = str + pageInfo.params[i].st + " 至 " + pageInfo.params[i].end;
			//}
			str = str + ")</span> <button class=\"btn btn-outline btn-danger btn-xs\" title=\"删除\" onclick=\"deleteParam('"+pageInfo.params[i].id+"')\" href=\"javascript:;\" ><i class=\"fa fa-times\"></i></button></span>";
			obj.append(str);
		}
	}
	//注册接收维度拖拽事件
	$("#p_param").droppable({
		accept:"#selectdatatree .tree-node",
		onDragEnter:function(e,source){
			var node = $("#selectdatatree").tree("getNode", source);
			var tp = node.attributes.col_type;
			//对维度拖拽设置图标
			if(tp == 1 ){
				$(source).draggable('proxy').find("span").removeClass("tree-dnd-no");
				$(source).draggable('proxy').find("span").addClass("tree-dnd-yes");
				$(this).css("border", "1px solid #ff0000");
			}
			e.cancelBubble=true;
			e.stopPropagation(); //阻止事件冒泡
		},
		onDragLeave:function(e,source){
			$(source).draggable('proxy').find("span").addClass("tree-dnd-no");
			$(source).draggable('proxy').find("span").removeClass("tree-dnd-yes");
			$(this).css("border", "1px dotted #999999");
			e.cancelBubble=true;
			e.stopPropagation(); //阻止事件冒泡
		},
		onDrop:function(e,source){
			e.cancelBubble=true;
			e.stopPropagation(); //阻止事件冒泡
			$(this).css("border", "1px dotted #999999");
			var node = $("#selectdatatree").tree("getNode", source);
			var tp = node.attributes.col_type;
			if(tp == 1){
				if(!pageInfo.params){
					pageInfo.params = [];
				}
				//判断是否存在
				if(findParamById(node.id) != null){
					msginfo("您已经添加了该参数！");
					return;
				}
				var id = node.attributes.col_id;
				var p = {"id":id, "name":node.text, "type":node.attributes.dim_type, "tname":node.attributes.tname,"colname":node.attributes.col, "tableName":node.attributes.tableName,"tableColKey":node.attributes.tableColKey,"tableColName":node.attributes.tableColName, vals:"", "tid":node.attributes.tid,"valType":node.attributes.valType,dyna:node.attributes.dyna,ord:node.attributes.ord, grouptype:node.attributes.grouptype,dateformat:node.attributes.dateformat};
				pageInfo.params.push(p);
				var obj = $(this);
				obj.find("div.ptabhelpr").remove();
				if(obj.find("b").size() == 0){
					obj.append("<b>参数： </b>");
				}
				obj.append("<span class=\"pppp\" id=\"pa_"+id+"\"><span title=\"筛选\" onclick=\"paramFilter('"+id+"', '"+node.attributes.dim_type+"','"+node.text+"')\" class=\"text\">"+node.text+"(无)</span> <button class=\"btn btn-outline btn-danger btn-xs\" title=\"删除\" onclick=\"deleteParam('"+id+"')\" href=\"javascript:;\" style=\"opacity: 0.6;\"><i class=\"fa fa-times\"></i></button></span>");
				initviewTree();
				//弹出筛选窗口
				paramFilter(id, p.type, p.name);
			}
		}
	});
}
function loadDimFunc(cube,dsource, dim, keyword){
	$.ajax({
		type:'post',
		dataType:'json',
		url: "DimFilter.action",
		data: {dsource:JSON.stringify(dsource), "dim":JSON.stringify(dim), "keyword":keyword, "aggreTable":cube.aggreTable},
		success: function(dt){
			var ctx = "";
			for(i=0; i<dt.length; i++){
				ctx = ctx + "<div class=\"checkbox checkbox-info\"><input type=\"checkbox\" id=\"D"+dt[i].id+"\" name=\"dimval\" value=\""+dt[i].id+"\" desc=\""+dt[i].text+"\"><label for=\"D"+dt[i].id+"\">"+dt[i].text+"</label></div>";
			}
			$("#pdailog .dxwd .wdlist").html(ctx);
		}
	});
};
function loadDimFunc2(cube,dsource, dim, keyword){
	//加载待选值
	$.ajax({
		type:'post',
		dataType:'json',
		url: "DimFilter!listVals.action",
		data: {dsource:JSON.stringify(dsource), "dim":JSON.stringify(dim), "keyword":keyword, "aggreTable":cube.aggreTable},
		success: function(dt){
			var str = "";
			for(i=0; i<dt.length; i++){
				str = str + "<div class=\"checkbox checkbox-info\"><input type=\"checkbox\" desc=\""+dt[i].text+"\" value=\""+dt[i].id+"\" name=\"dimval\" id=\"D"+dt[i].id+"\"><label for=\"D"+dt[i].id+"\">"+dt[i].text+"</label></div>";
			}
			$("#pdailog .dxwd .wdlist").html(str);
		}
	});
};
function paramFilter(id, type, name){
	var param = findParamById(id);
	var cube = fundCubeById(param.tid);
	var dset = findDatasetById(cube.datasetid);
	var dsource = findDatasourceById(dset.dsid);
	var vals = [];
	if(param.vals){
		vals = param.vals.split(",");
	}
	var isdimExist = function(val){
		var exist = false;
		for(j=0; j<vals.length; j++){
			if(val == vals[j]){
				exist = true;
				break;
			}
		}
		return exist;
	}
	var ctx = "";
	var selectDim = "";
	var valStr = param.valStrs ? param.valStrs.split(",") : [];
	for(j=0; j<vals.length; j++){
		selectDim = selectDim + "<div class=\"checkbox checkbox-info\"><input type=\"checkbox\" id=\"S"+vals[j]+"\" name=\"dimselcet\" value=\""+vals[j]+"\" desc=\""+valStr[j]+"\"><label for=\"S"+vals[j]+"\">"+valStr[j]+"</label></div>";
	}
	ctx = "<div class=\"dxwd\"><div class=\"wdhead\">待选维度</div><input id=\"dimsearch\" style=\"width:230px;\"></input><div class=\"wdlist\" style=\"height:278px;\"></div></div><div class=\"xzwdbtn\"><button type=\"button\" id=\"xzwd\" style=\"margin-top:120px;\" title=\"选择\" class=\"btn btn-success btn-circle\">></button><br/><br/><button type=\"button\" id=\"scwd\" title=\"删除\" class=\"btn btn-success btn-circle\"><</button></div><div class=\"yxwd\"><div class=\"wdhead\">已选维度</div><div class=\"wdlist\">"+selectDim+"</div></div>";
	$('#pdailog').dialog({
		title: name+' - 参数值筛选',
		width: 546,
		height: 410,
		closed: false,
		cache: false,
		modal: true,
		content: ctx,
		buttons:[{
				text:'确定',
				iconCls:'icon-ok',
				handler:function(){
					var vals = "";
					var valStrs = "";
					//if(param.type == 'frd'){
						var seles = $("#pdailog input[name='dimselcet']");
						if(seles.size() == 0){
							param.vals = "";
							param.valStrs = "";
							$("#optarea #p_param #pa_"+id+" span.text").text(name+"(无)");
						}else{
							seles.each(function(a, b){
									vals = vals + $(this).val();
									if(a != seles.size() - 1){
									   vals = vals + ',';
									}
									valStrs = valStrs + $(this).attr("desc");
									if(a != seles.size() - 1){
									   valStrs = valStrs + ',';
									}
							});
							$("#optarea #p_param #pa_"+id+" span.text").text(name+"("+(valStrs == '' ? '无':valStrs)+")");
							param.vals = vals;
							param.valStrs = valStrs;
						}
					//}
					$('#pdailog').dialog('close');
					curTmpInfo.isupdate = true;
					flushPage();
				}
			},{
				text:'取消',
				iconCls:'icon-cancel',
				handler:function(){
					$('#pdailog').dialog('close');
				}
			}]
	});
	if(param.tableName == '' || param.tableColKey == '' || param.tableColName == ''){
		loadDimFunc2(cube, dsource, param, "");
	}else{
		//获取维度值列表
		loadDimFunc(cube, dsource, param, "");
	}
	//注册维度选择事件
	$("#pdailog #xzwd").click(function(){
		var ls = $("#pdailog input[name='dimselcet']");
		var isExist = function(val){
			var exist =false;
			for(i=0;i<ls.size(); i++){
				if($(ls.get(i)).val() == val){
					exist = true;
					break;
				}
			}
			return exist;
		}
		$("#pdailog input[name='dimval']:checkbox:checked").each(function(index, element) {
			if(!isExist($(element).val())){
				var str = "<div class=\"checkbox checkbox-info\"><input type=\"checkbox\" desc=\""+$(element).attr("desc")+"\" value=\""+$(element).val()+"\" name=\"dimselcet\" id=\"S"+$(element).val()+"\"><label for=\"S"+$(element).val()+"\">"+$(element).attr("desc")+"</label></div>";
				$("#pdailog .yxwd .wdlist").append(str);
			}
        });
	});
	//注册维度删除事件
	$("#pdailog #scwd").click(function(){
		$("#pdailog input[name='dimselcet']:checkbox:checked").each(function(index, element) {
            $(element).parent().remove();
        });
	});
	//搜索按钮
	$("#pdailog #dimsearch").searchbox({
		searcher:function(value,name){
			if(param.tableName == '' || param.tableColKey == '' || param.tableColName == ''){
				loadDimFunc2(cube, dsource, param, value);
			}else{
				loadDimFunc(cube, dsource, param, value);
			}
		},
		prompt:'维度搜索...'
	});
}
function flushPage(){
	//刷新页面
	for(var k=0; pageInfo.comps&&k<pageInfo.comps.length; k++){
		var tp = pageInfo.comps[k].type;
		if(tp == 'table'){
			tableView(pageInfo.comps[k], pageInfo.comps[k].id);
		}else if(tp == 'chart'){
			chartview(pageInfo.comps[k], pageInfo.comps[k].id);
		}
	}
}
function deleteParam(id){
	$("#p_param #pa_" + id).remove();
	var idx = -1;
	for(i=0; pageInfo.params&&i<pageInfo.params.length; i++){
		var p = pageInfo.params[i];
		if(p.id == id){
			idx = i;
			break;
		}
	}
	pageInfo.params.splice(idx, 1);
	if(pageInfo.params.length == 0){
		$("#p_param").html("<div class=\"ptabhelpr\">拖拽维度到此处作为页面参数</div>");
	}
	initviewTree();
	flushPage();
}
function initviewTree(){
	var dt = [{
			text:'页面参数',
			id:'param',
			state:'open',
			iconCls:'icon-param'
		},{
			text:'页面组件',
			id:'comp',
			state:'open'
		}];
	if(pageInfo.params){
		dt[0].children = [];
		for(var i=0; i<pageInfo.params.length; i++){
			var obj = pageInfo.params[i];
			dt[0].children.push({text:obj.name,id:obj.id, iconCls:"icon-param", attributes:{showmenu:false,type:'param'}});
		}
	}	
	
	if(pageInfo.comps){
		dt[1].children = [];
		for(var j=0; j<pageInfo.comps.length; j++){
			var comp = pageInfo.comps[j];
			var obj = {text:comp.name, id:comp.id, attributes:{showmenu:true,type:'compview'}};
			var type = comp.type;
			if(type == 'chart'){
				obj.iconCls = "icon-chart";
			}else if(type == 'table'){
				obj.iconCls = "icon-cross";
			}else if(type == 'text'){
				obj.iconCls = "icon-label";
			}
			dt[1].children.push(obj);
		}
	}
	$("#viewtree").tree({
		data:dt,
		onContextMenu: function(e, node){
			e.preventDefault();
			if(!node.attributes || node.attributes.showmenu != true || node.attributes.type == 'compview'){
				return;
			}
			curTmpInfo.tp = node.attributes.type;
			curTmpInfo.id = node.id;
			$('#viewtree').tree('select', node.target);
			$('#mydatasetmenu').menu('show', {
				left: e.pageX,
				top: e.pageY
			});
		},
		onClick: function(node){
			/**
			if(node.attributes.type == 'compview'){
				compBorderSet($("#"+node.id));
				setProp($("#"+node.id).parent().attr("id").split("_")[1], node.id);
			}
			**/
		}
	});
}
//view == true 表示当前为浏览状态页面
function openreport(view){
	$('#pdailog').dialog({
		title: '打开报表',
		width: 550,
		height: 300,
		closed: false,
		cache: false,
		modal: true,
		toolbar:null,
		onLoad:function(){},
		buttons:[{
				text:'确定',
				iconCls:"icon-ok",
				handler:function(){
					var r = $("input[name=\"reportId\"]:checked").val();
					if(!r || r == null){
						msginfo("请至少选择一个报表！");
						return;
					}
					$('#pdailog').dialog('close');
					var url = (view?"ReportDesign!view.action":"ReportDesign.action") + '?pageId='+r;
					if(curTmpInfo.isupdate == true){
						if(confirm('页面还未保存\n是否保存当前页面？')){
							savepage(view,function(){
								location.href = url;
							});
						}else{
							location.href = url;
						}
					}else{
						location.href = url;
					}
				}
			},{
				text:'取消',
				iconCls:"icon-cancel",
				handler:function(){
					$('#pdailog').dialog('close');
				}
			}]
	});
	$('#pdailog').dialog('refresh', 'MyReport!list.action?view='+curTmpInfo.view);
}
function findCompById(id){
	var ret = null;
	for(i=0;i<pageInfo.comps.length; i++){
		var t = pageInfo.comps[i];
		if(t.id == id){
			ret = t;
			break;
		}
	}
	return ret;
}

function delComp(id){
	//从全局对象中移除
	var idx = -1;
	for(i=0;i<pageInfo.comps.length; i++){
		var t = pageInfo.comps[i];
		if(t.id == id){
			idx = i;
			break;
		}
	}
	pageInfo.comps.splice(idx, 1);
	$("#T" + id).remove();
	if(pageInfo.comps.length == 0){
		$("#optarea").append("<div class='tabhelpr'>请先添加组件再进行多维分析(点击<strong>插入</strong>按钮)。</div>");
	}
	initviewTree();
}

/**
* tp = table, chart, text 3种类型
  curComp  有值得话 表示当前是回写， 没值表示是新增
**/
function addComp(id, name, ctx, ispush, tp, curComp){
	//清空提示信息
	if(pageInfo.comps.length == 0){
		$("#optarea .tabhelpr").remove();
	}
	
	if(ctx == null || ctx == undefined){
		if(tp =='table'){
			//判断是新增，还是回写已有的
			if(curComp == null || curComp == undefined){
				ctx = crtCrossTable();
			}else{
				if(curComp.tableJson == undefined || curComp.kpiJson == undefined){ //添加了组件，但未选指标
					ctx = crtCrossTable();
				}else{
					ctx = "";
				}
			}
		}else if(tp == 'chart'){
			ctx = crtChart(id);
		}
	}
	
	//是否向全局对象中添加内容
	if(ispush == true){
		pageInfo.comps.push({"id":id, "name":name, "type":tp});
		curTmpInfo.isupdate= true;
		initviewTree();
	}
	$("<div class=\"comp_table ibox\" tp=\""+tp+"\" id=\"T"+id+"\"><div class=\"title ibox-title\"><h5>"+name +"</h5><div class=\"ibox-tools\"><button title='删除组件' class=\"btn btn-outline btn-danger btn-xs\" onclick=delComp('"+id+"') ><i class=\"fa fa-times\"></i></button></div></div><div class=\"ctx ibox-content\""+ (tp =='text' ? "title=\"双击修改文本内容\"" : "") +">"+(ctx == null ? "" : ctx)+"</div></div>").appendTo("#optarea");
	
	//如果是表格或图形，增加接受拖拽事件
	if(tp == 'table'){
		//表格接收拖拽事件
		if(curComp != null && curComp != undefined){
			if(curComp.tableJson == undefined || curComp.kpiJson == undefined){ //添加了组件，但未选指标,需要添加拖放指标事件
				initDropDiv(id);
			}else{
				tableView(curComp, id);
			}
		}else{
			initDropDiv(id);
		}
	}
	
	if(tp == 'chart'){
		//如果是回写，更新图形数据
		if(curComp != null && curComp != undefined){
			chartview(curComp, id);
			//回写配置信息
			backChartData(curComp);
			//图形接收拖拽事件
			if(curComp.chartJson.type == 'bubble' || curComp.chartJson.type == 'scatter'){
				initChartByScatter(id);
			}else{
				initChartKpiDrop(id)
			}
		}else{
			//或者是新增
			//图形接收拖拽事件
			if(curTmpInfo.charttype == 'bubble' || curTmpInfo.charttype == 'scatter'){
				initChartByScatter(id);
			}else{
				initChartKpiDrop(id)
			}
		}
	}
	
	//如果是文本组件，回写文本内容
	if(tp == 'text'){
		//findCompById(id).text = ctx;
		//注册双击修改内容事件
		$("#T" + id +" div.ctx").bind("dblclick", function(){
			insertText("update", id);
		});
	}
	
	//增加组件间拖拽事件
	liveCompMoveEvent(id);
	
	//在新增的情况下，把滚动条移动到最下边
	if(curComp == null || curComp == undefined){
		var p = $("#T"+id).offset();
		$("#optarea").scrollTop(p.top);
	}
}

//创建交叉表
function crtCrossTable(){
	var ret = "<table class='d_table'><tr><td class='blank'>"
		+ "</td><td>"+
		"<div id='d_colDims' class='tabhelpr'>将维度拖到此处作为列标签</div>"+"</td></tr><tr><td>"+
		"<div id='d_rowDims' class='tabhelpr'>将维度拖到此处<br>作为行标签</div>"+"</td><td>"+
		"<div id='d_kpi' class='tabhelpr'>将度量拖到此处<br>查询数据</div>"+"</td></tr></table>";
	return ret;
}
/**
判断是否存在date类型的维度，比如day/month/quarter/year
**/
function isExistDateDim(comp, tp){
	var ret = false;
	if(tp == 'table'){
		if(!comp.tableJson || !comp.tableJson.cols){
			return ret;
		}
		for(var i=0; i<comp.tableJson.cols.length; i++){
			var o = comp.tableJson.cols[i];
			if(o.grouptype == 'date' && o.type != 'frd'){
				ret = true;
				break;
			}
		}
		if(!comp.tableJson || !comp.tableJson.rows){
			return ret;
		}
		for(var i=0; i<comp.tableJson.rows.length; i++){
			var o = comp.tableJson.rows[i];
			if(o.grouptype == 'date' && o.type != 'frd'){
				ret = true;
				break;
			}
		}
	}
	if(tp == 'chart'){
		if(!comp.chartJson || !comp.chartJson.params){
			return ret;
		}
		for(var i=0; i<comp.chartJson.params.length; i++){
			var o = comp.tableJson.cols[i];
			if(o.grouptype == 'date' && o.type != 'frd'){
				ret = true;
				break;
			}
		}
		if(!comp.chartJson || !comp.chartJson.xcol){
			return ret;
		}
		if(comp.chartJson.xcol.grouptype == 'date' && comp.chartJson.xcol.type != 'frd'){
			ret = true;
		}
	}
	return ret;
}

/**
注册行列维度、指标区域的拖拽事件
对应表格组件的事件
**/
function initDropDiv(id){
	var ischg = false;
	$("#T" + id + " #d_colDims, #T" + id +" #d_rowDims, #T"+id+" #d_kpi").droppable({
		accept:"#selectdatatree .tree-node",
		onDragEnter:function(e,source){
			var node = $("#selectdatatree").tree("getNode", source);
			var tp = node.attributes.col_type;
			//对维度拖拽设置图标
			if(tp == 1 && ($(this).attr("id") == "d_colDims" || $(this).attr("id") == "d_rowDims")){
				$(source).draggable('proxy').find("span").removeClass("tree-dnd-no");
				$(source).draggable('proxy').find("span").addClass("tree-dnd-yes");
				
				if($(this).attr("id") == "d_colDims"){
					$("#T"+id+" #d_colDims").css("border", "1px solid #ff0000");
				}
				if($(this).attr("id") == "d_rowDims"){
					$("#T"+id+" #d_rowDims").css("border", "1px solid #ff0000");
				}
				
				ischg = true;
			}else{
				ischg = false;
			}
				
			//对指标拖拽设置图标
			if(tp == 2 && $(this).attr("id") == "d_kpi"){
				$(source).draggable('proxy').find("span").removeClass("tree-dnd-no");
				$(source).draggable('proxy').find("span").addClass("tree-dnd-yes");
				
				$("#T"+id+" #d_kpi").css("border", "1px solid #ff0000");
				
				ischg = false;
			}
			e.cancelBubble=true;
			e.stopPropagation(); //阻止事件冒泡
		},
		onDragLeave:function(e,source){
			
			if($(this).attr("id") == 'd_kpi' && ischg == true){
			}else{
				$(source).draggable('proxy').find("span").addClass("tree-dnd-no");
				$(source).draggable('proxy').find("span").removeClass("tree-dnd-yes");
				
				$("#T"+id+" #" + $(this).attr("id")).css("border", "none");
			}
			e.cancelBubble=true;
			e.stopPropagation(); //阻止事件冒泡
		},
		onDrop:function(e,source){
			var id = $(this).parents(".comp_table").attr("id").replace("T","");
			var json = findCompById(Number(id));
			
			e.cancelBubble=true;
			e.stopPropagation(); //阻止事件冒泡
			
			//清除边框颜色
			$("#T"+id+" #" + $(this).attr("id")).css("border", "none");
			
			//获取TREE
			var node = $("#selectdatatree").tree("getNode", source);
			
			//判断拖入的维度及指标是否和以前维度及指标在同一个表。
			if(json.tid != undefined){
				if(json.tid != node.attributes.tid){
					msginfo("您拖入的"+ (node.attributes.col_type == 2 ? "度量" : "维度") +"与表格已有的内容不在同一个立方体中，拖放失败。");
					return;
				}
			}
			
			//判断拖入的指标是否是（同比、环比），如果是，需要判断当前维度是否有date类型
			if(node.attributes.calc_kpi == 1){
				if(!isExistDateDim(json, 'table')){
					msginfo("您拖入的度量需要表格中先有时间类型的维度(年/季度/月/日)。");
					return;
				}
			}
			
			json.tid = node.attributes.tid;
			
			if(json.kpiJson == undefined){
				json.kpiJson = [];
			};
			if(json.tableJson == undefined){
				json.tableJson = {"cols":[], "rows":[]};
			}
			//写指标
			if(node.attributes.col_type == 2 && $(this).attr("id") == "d_kpi"){
				//如果指标存在就忽略
				if(!kpiExist(node.id, json.kpiJson)){
					json.kpiJson.push({"kpi_id":node.id, "kpi_name" : node.text, "col_name":node.attributes.col_name,"tname":node.attributes.tname, "aggre":node.attributes.aggre, "fmt":node.attributes.fmt, "alias":node.attributes.alias,"tid":json.tid,"unit":node.attributes.unit,"rate":node.attributes.rate,"calc":node.attributes.calc,"dyna":node.attributes.dyna});
				}else{
					msginfo("度量已经存在。");
					return;
				}
				curTmpInfo.isupdate = true;
				tableView(json, Number(id));
			}
			//写维度
			if(node.attributes.col_type == 1){
				//写col维度
				if($(this).attr("id") == "d_colDims"){
					if(dimExist(node.id, json.tableJson.cols) || dimExist(node.id, json.tableJson.rows)){
						msginfo("维度已经存在。");
						return;
					}
					//如果维度有分组，分组必须相同
					var group = node.attributes.grouptype;
					if(group != null && group != "" && findGroup(json.tableJson.rows, group)){
						msginfo("拖放失败，同一分组的维度必须在同一行/列标签。");
						return;
					}
					json.tableJson.cols.push({"id":node.id, "dimdesc" : node.text, "type":node.attributes.dim_type, "colname":node.attributes.col,"tid":json.tid,"iscas":node.attributes.iscas,"tname":node.attributes.tname, "tableName":node.attributes.tableName, "tableColKey":node.attributes.tableColKey,"tableColName":node.attributes.tableColName, "dimord":node.attributes.dimord, "dim_name":node.attributes.dim_name,"grouptype":node.attributes.grouptype,"valType":node.attributes.valType,"dyna":node.attributes.dyna,"ord":node.attributes.ord,dateformat:node.attributes.dateformat});
					curTmpInfo.isupdate = true;
					tableView(json, Number(id));
				}
				//写row维度
				if($(this).attr("id") == "d_rowDims"){
					if(dimExist(node.id, json.tableJson.rows) || dimExist(node.id, json.tableJson.cols)){
						msginfo("维度已经存在。");
						return;
					}
					//如果维度有分组，分组必须相同
					var group = node.attributes.grouptype;
					if(group != null && findGroup(json.tableJson.cols, group)){
						msginfo("拖放失败，同一分组的维度必须在同一行/列标签。");
						return;
					}
					json.tableJson.rows.push({"id":node.id, "dimdesc" : node.text, "type":node.attributes.dim_type, "colname":node.attributes.col,"tid":json.tid,"iscas":node.attributes.iscas, "tname":node.attributes.tname, "tableName":node.attributes.tableName, "tableColKey":node.attributes.tableColKey,"tableColName":node.attributes.tableColName, "dimord":node.attributes.dimord, "dim_name":node.attributes.dim_name,"grouptype":node.attributes.grouptype,"valType":node.attributes.valType,"dyna":node.attributes.dyna,"ord":node.attributes.ord,dateformat:node.attributes.dateformat});
					curTmpInfo.isupdate = true;
					tableView(json, Number(id));
				}
			}
		}
	});
	
}
//查找维度分组
function findGroup(dims, group, curNode){
	var ret = false;
	if(!dims || dims == null){
		return ret;
	}
	for(m=0; m<dims.length; m++){
		if(curNode && curNode == dims[m]){  //curNode存在表示忽略当前节点
			continue; 
		}
		if(dims[m].grouptype == group){
			ret = true;
			break;
		}
	}
	return ret;
}
function getMaxCompId(){
		var maxid = 1;
		for(i=0;i<pageInfo.comps.length; i++){
			var t = pageInfo.comps[i];
			if(t.id > maxid){
				maxid = t.id;
			}
		}
    return maxid + 1;
}
//state = 'insert/update' 表示文本组件当前是新添加还是修改内容
//compId 参数在新增时并没有
function insertText(state, compId){
	$('#pdailog').dialog({
		title: '请输入文本内容 - 文本组件',
		width: 490,
		height: 226,
		closed: false,
		cache: false,
		modal: true,
		toolbar:null,
		content: '<div class="txtctxdiv"><textarea name="txtctx" id="txtctx" cols=\"84\" rows=\"8\"></textarea></div>',
		buttons:[{
					text:'确定',
					iconCls:"icon-ok",
					handler:function(){
						if(state == 'insert'){
							var txt = $("#txtctx").val().replace(/\n/g,"<br>");
							var cpid = getMaxCompId();
							addComp(cpid, "文本组件", txt, true, "text");
							findCompById(cpid).text = $("#txtctx").val();
						}
						if(state == 'update'){
							var json = findCompById(compId);
							json.text =  $("#txtctx").val();
							$("#T"+compId+" div.ctx").html($("#txtctx").val().replace(/\n/g,"<br>"));
							//更新页面为已修改
							curTmpInfo.isupdate = true;
						}
						$('#pdailog').dialog('close');
					}
				},{
					text:'取消',
					iconCls:"icon-cancel",
					handler:function(){
						$('#pdailog').dialog('close');
					}
				}]
	});
	if(compId){
		var json = findCompById(compId);
		$("#txtctx").val(json.text);
	}
	$("#txtctx").focus();
}

function loadMyReportTree(){
	$('#myreporttree').tree({
		url:'MyReport!tree.action?view='+curTmpInfo.view,
		dnd:false,
		onDblClick:function(node){
			//alert(node.id);
			if(node.id == "sharereport"){
				return;
			}
			location.href = (curTmpInfo.view?'ReportDesign!view.action':'ReportDesign.action') + '?pageId='+node.id;
		},
		onContextMenu: function(e, node){
			e.preventDefault();
			if(node.id == "sharereport" || 'y' == node.attributes.sharefile){
				return;
			}
			//判断共享、未共享标识
			if(curTmpInfo.view != true){
				if(node.attributes.share == "y"){
					$('#myreportmenu').menu("disableItem", $("#myreportmenu #m_share"));
					$('#myreportmenu').menu("enableItem", $("#myreportmenu #m_share2"));
				}else{
					$('#myreportmenu').menu("enableItem", $("#myreportmenu #m_share"));
					$('#myreportmenu').menu("disableItem", $("#myreportmenu #m_share2"));
				}
			}
			$('#myreporttree').tree('select', node.target);
			$('#myreportmenu').menu('show', {
				left: e.pageX,
				top: e.pageY
			});
			pageInfo.reportId = node.id;

		}
	});
}

function deletemyreport(){
	if(confirm("是否确认删除？")){
		$.post("MyReport!delete.action", {"reportId": pageInfo.reportId,"view":curTmpInfo.view}, function(resp){
			var node = $('#myreporttree').tree('getSelected');
			$('#myreporttree').tree('remove', node.target);
		});
	}
}

function chgreportname(){
	var node = $('#myreporttree').tree('getSelected');
	$.messager.prompt('提示信息', '请输入新文件名称：', function(r){
		if (r){
			$.post("MyReport!rename.action", {"reportId": pageInfo.reportId, "reportName":r, "view":curTmpInfo.view}, function(resp){
				if (node){
					$('#myreporttree').tree('update', {
						target: node.target,
						text: r
					});
				}

			});
		}
	});
	$(".messager-input").val(node.text);
	$(".messager-input").select();
}
/**
对组件进行重新排序
**/
function resortComp(){
	var tmp = pageInfo.comps;
	pageInfo.comps = [];
	$("#optarea").children().each(function(index, element) {
		if($(this).hasClass("comp_table")){
			var target = Number($(this).attr("id").replace("T", ""));
			for(i=0; i<tmp.length; i++){
				if(tmp[i].id == target){
					pageInfo.comps.push(tmp[i]);
					//清除dims内容
					delete tmp[i].dims;
					break;
				}
			}
		}
    });
}
/**
view, =true 表示当前为查询状态
cb 传入回调函数
nomsg 如果是tree,不显示提示信息
*/
function savepage(view, cb, nomsg){
	if(curTmpInfo.view && curTmpInfo.share == 'y'){
		msginfo("您不能保存共享报表，请先另存报表后再修改。");
		return
	}
    resortComp();
	var jsonStr = JSON.stringify(pageInfo);
	var pageId = pageInfo.id;
	if(pageId == undefined || pageId == null){
		pageId = "";
	}
	if(pageId == ''){ //未保存过，提示用户输入名称
		$.messager.prompt('提示信息', '请输入您要保存的文件名称：', function(r){
			if (r){
				$.post("ReportDesign!save.action", {"pageInfo": jsonStr, "pageId":pageId, "pageName" : r, "view":view}, function(resp){
					var oo = eval("("+resp+")");
					if(oo.state == 1){
						showmsg(oo.msg);
					}else{
						pageInfo.id = oo.pageId;
						if(cb != undefined){
							cb();
						}else{
							
						}
						//刷新myreport数
						loadMyReportTree();
						msginfo("保存成功！", "suc");
						//更新页面为未修改
						curTmpInfo.isupdate = false;
					}
				});
			}
		});
		$(".messager-input").focus();
	}else{ //已经保存过，直接update
		$.post("ReportDesign!save.action", {"pageInfo": jsonStr, "pageId":pageId, "view":view}, function(resp){
			var oo = eval("("+resp+")");
			if(oo.state == 1){
				showmsg(oo.msg);
			}else{
				if(cb != undefined){
					cb();
				}else{
				}
				if(!nomsg || nomsg ==false){
					msginfo("保存成功！", "suc");
				}
				//更新页面为未修改
				curTmpInfo.isupdate = false;
			}
		});
	}
} 
//另存
function saveas(view){
	resortComp();
	
	var jsonStr = JSON.stringify(pageInfo);
	var json = eval("("+jsonStr+")");
	if(view && curTmpInfo.share == 'y' && !json.linkReport){  //如果是view，并且是共享报表，设置linkReport,删除 datasource,dataset,cube
		//delete json.datasource;
		//delete json.dataset;
		//delete json.cube;
		//设置linkReport
		json.linkReport = pageInfo.id;
	}
	$.messager.prompt('提示信息', '请输入您要另存的文件名称：', function(r){
		if (r){
			$.post("ReportDesign!save.action", {"pageInfo": JSON.stringify(json), "pageId":'', "pageName" : r, "view":view}, function(resp){
				//刷新myreport数
				loadMyReportTree();
				msginfo("保存成功！", "suc");
			});
		}
	});
	$(".messager-input").focus();
}

//注册组件间移动的事件，改名事件
function liveCompMoveEvent(id){
	//改名事件
	var json = findCompById(id);
	$("#T" + id + " .title .tname").bind("dblclick", function(){
		var ts = this;
		$.messager.prompt('提示信息', '请输入新的组件名称：', function(r){
			if(r != undefined){
				var compId = $(ts).parents(".comp_table").attr("id").replace("T","");
				findCompById(compId).name = r;
				$(ts).html(r);
			}
		});
		$(".messager-input").val($(this).text());
		$(".messager-input").select();
	});
	
	$("#T" + id).draggable({
		revert:true,
		handle:$("#T" + id + " .title .mvcomp"),
		proxy:function(source){
			var width = $(source).width();
			var height = $(source).height();
			var p = $('<div style="border:1px solid #999999;background-color:#cccccc; opacity:0.5; filter:alpha(opacity=50); width:'+width+'px; height:'+height+'px;"></div>');
			p.appendTo('body');
			return p;
		},
		onBeforeDrag:function(e){
			//if($(e.target).attr("class") == 'tname'){
			//	return true;
			//}else{
			//	return false;
			//}
		},
		onStartDrag:function(e){
			//$(this).hide();
		},
		onStopDrag:function(e){
			//$(this).show()
			//修改鼠标为默认
			$("body").css("cursor", "default");
		}
	});
	$("#optarea,#T" + id).droppable({
		accept:".comp_table",
		onDragEnter:function(e,source){
			//这是组件间的移动
			if($(this).hasClass("comp_table")){
				$(".indicator").css({
					display:'block',
					left:$(this).offset().left,
					top:$(this).offset().top - 10
				});
				curTmpInfo.curComp = {tp:"zjj", obj:$(this)};
				e.cancelBubble=true;
				e.stopPropagation(); //阻止事件冒泡
			}else{
				//移动到组件外.给当前布局器最后追加
				var last = $(this).children().last();
				var pos = last.offset();
				curTmpInfo.curComp = {tp:"zjw", obj:$(this)};
				$(".indicator").css({
					display:'block',
					left:pos.left - 10,
					top:pos.top - 5 + $(last).height()
				});
			}
		},
		onDragLeave:function(e,source){
			if($(this).hasClass("comp_table")){
				var last = $(this).children().last();
				var pos = last.offset();
				$(".indicator").css({
					display:'block',
					left:pos.left - 10,
					top:pos.top - 5 + $(last).height()
				});
				curTmpInfo.curComp = {tp:"zjw", obj:$(this)};
				e.cancelBubble=true;
				e.stopPropagation(); //阻止事件冒泡
			}else{
				$(".indicator").hide();
			}
		},
		onDrop:function(e,source){
			$(".indicator").hide();
			//这是组件间的移动
			if(curTmpInfo.curComp && curTmpInfo.curComp.tp == 'zjj'){
				curTmpInfo.isupdate = true;
				$(source).insertBefore(curTmpInfo.curComp.obj);
				e.cancelBubble=true;
				e.stopPropagation(); //阻止事件冒泡
			}else if(curTmpInfo.curComp.tp && curTmpInfo.curComp.tp == 'zjw'){
				$("#optarea").append(source);
			}
		}

	});
}

function kpicompute(tp){
	//设置计算类型， 1表示不能同时存在，2表示可以同时存在。
	var tpobj = {"zb":1, "sq":2, "tq":2, "zje":2, "hb":2, "tb":2}
	var kpiId = curTmpInfo.ckid;
	var compId = curTmpInfo.compId.replace("T", "");
	var comp = findCompById(compId);
	var kpi = findKpiById(kpiId, comp.kpiJson);
	if(tp == "zb"){
		kpi.compute = "zb";
	}else{
		if(!isExistDateDim(comp, 'table')){
			msginfo("当前指标计算需要表格中先有时间类型的维度(年/季度/月/日)。");
			return;
		}		
		//如果有参数,并且参数是时间维度，需要判断表格中是否有同样的参数维度，如果没有提示用户添加
		if(!paramsamedimdate(comp)){
			msginfo("指标计算时，需要表格中具有和参数相同的维度。");
			return;
		}
		//先判断已经存在的，如果是时间偏移计算就追加，或者替换.
		var exist = kpi.compute;
		if(!exist || exist == ""){
			kpi.compute = tp;
		}else{
			var js = exist.split(",");
			if(tpobj[js[0]] == 1){
				kpi.compute = tp;
			}else{
				var cz = false;   //不存在才添加
				for(j=0; j<js.length; j++){
					if(js[j] == tp){
						cz = true;
						break;
					}
				}
				if(!cz){
					kpi.compute = exist+","+tp;
				}
			}
		}
	}
	tableView(comp, compId);
}

/**
compId 是组件的ID
**/
function tableView(table, compId){
	if(table.tableJson == undefined || table.kpiJson == undefined){
		return;
	}	//如果没有指标，维度等内容，返回界面到初始状态
	if(table.kpiJson.length == 0 && table.tableJson.cols.length == 0 && table.tableJson.rows.length == 0){
		$("#T" + compId + " div.ctx").html(crtCrossTable());
		initDropDiv(compId);
		return;
	}
	
	//先添加指标维，在列维度上
	table.tableJson.cols.push({"type":"kpiOther","id":"kpi"});
	var tableJson = JSON.stringify(table.tableJson);
	table.tableJson.cols.pop();
	
	//处理参数
	var params = [];
	if(pageInfo.params && pageInfo.params.length > 0){
		for(k=0; k<pageInfo.params.length; k++){
			if(pageInfo.params[k].tid == table.tid){
				params.push(pageInfo.params[k]);
			}
		}
	}
	
	//移除指标维
	//removeKpiOther(table.tableJson.cols);
	var kpiJson = JSON.stringify(table.kpiJson);
	//获取dset, dsource
	var cube = fundCubeById(table.tid);
	if(cube == null){
		$("#T" + compId + " div.ctx").html("组件关联的立方体已经失效，请移除该组件。");
		return;
	}
	var dset = findDatasetById(cube.datasetid);
	if(dset == null){
		$("#T" + compId + " div.ctx").html("组件关联的数据集已经失效，请移除该组件。");
		return;
	}
	//dset只取部分信息, 如果立方体是聚集立方体，取立方体聚集表
	var ndset = {name:dset.name, master:dset.master, aggreTable:cube.aggreTable,joininfo:dset.joininfo, param:dset.param};
	var dsource = findDatasourceById(dset.dsid);
	if(dsource == null){
		$("#T" + compId + " div.ctx").html("组件关联的数据源已经失效，请移除该组件。");
		return;
	}
	//获取cubeKpis 用在数据缓存中
	var cubeKpis = [];
	for(i=0; i<cube.kpi.length; i++){
		var k = cube.kpi[i];
		var alias = k.aggre+"_" + k.id; //查询SQL的别名是 aggre+id
		cubeKpis.push({calc:(k.calc==true?true:false),col_name:k.col,aggre:k.aggre,alias:alias,tname:k.tname});
	}
	showloading();
	$.ajax({
	   type: "POST",
	   url: "TableView.action",
	   dataType:"html",                                            //有cubeId表示启用缓存，没有cuebeId表示不启用缓存
	   data: {"tableJson":tableJson, "kpiJson":kpiJson, divison:(cube.divison?JSON.stringify(cube.divison):"{}"), "cubeId":(cube.cache?cube.id:""),"compId":compId, "params":JSON.stringify(params), "dset":JSON.stringify(ndset), "dsource":JSON.stringify(dsource), "cubeKpis":(cube.cache?JSON.stringify(cubeKpis):"[]")},
	   success: function(resp){
		  hideLoading();
		  $("#T" + compId + " div.ctx").html(resp);
		   
		 //重新注册拖放事件(从指标拖入的事件)
		  initDropDiv(compId);
	   },
	   error:function(resp){
		    hideLoading();
		   $.messager.alert('出错了','系统出错，请查看后台日志。','error');
	   }
	});
	
}
function kpiFilter(tp){
	var kpiId = curTmpInfo.ckid;
	var compId = curTmpInfo.compId.replace("T", "");
	var comp = findCompById(compId);
	var kpi = findKpiById(kpiId, comp.kpiJson);
	var ft = kpi.filter;
	var unitStr = "";
	if(kpi.rate == 1000){
		unitStr = "千";
	}else if(kpi.rate == 10000){
		unitStr = "万";
	}else if(kpi.rate == 1000000){
		unitStr = "百万";
	}else if(kpi.rate == 100000000){
		unitStr = "亿";
	}
	var ctx = "<div style='line-height:25px; margin:5px;'><br/> "+kpi.kpi_name+" &nbsp; <select id=\"ftype\"><option value=\"\"></option><option value=\">\" "+(ft&&ft.filterType==">"?"selected":"")+">大于</option><option value=\"<\" "+(ft&&ft.filterType=="<"?"selected":"")+">小于</option><option value=\"=\" "+(ft&&ft.filterType=="="?"selected":"")+">等于</option><option value=\"between\" "+(ft&&ft.filterType=="between"?"selected":"")+">区间</option></select> &nbsp; <input type=\"text\" id=\"startval\" size=\"5\" value=\""+(ft?ft.val1:"")+"\"><span id=\"endvalspan\" style=\"display:"+(ft&&ft.filterType=='between'?"inline":"none")+"\"> - <input type=\"text\" id=\"endval\" size=\"5\" value=\""+(ft?ft.val2:"")+"\"></span>" + unitStr+(kpi.unit?kpi.unit:"")+"<br/>[<a id=\"clear\" href='javascript:;'>清除筛选</a>]</div>";
	$('#pdailog').dialog({
		title: '度量筛选',
		width: 330,
		height: 180,
		closed: false,
		cache: false,
		modal: true,
		toolbar:null,
		content: ctx,
		buttons:[{
					text:'确定',
					iconCls:'icon-ok',
					handler:function(){
						var ft = $("#pdailog #ftype").val();
						var sv = $("#pdailog #startval").val();
						var ev = $("#pdailog #endval").val();
						if(ft == "" || sv == ""){
							delete kpi.filter;
						}else{
							var filter = {"kpi":kpi.kpi_id,"filterType":ft,"val1":Number(sv),"val2":(ev == ""?0:Number(ev))};
							kpi.filter = filter;
						}
						$('#pdailog').dialog('close');
						curTmpInfo.isupdate = true;
						if(tp == 'table'){
							tableView(comp, compId);
						}else if(tp == 'chart'){
							chartview(comp, compId);
						}
					}
				},{
					text:'取消',
					iconCls:'icon-cancel',
					handler:function(){
						$('#pdailog').dialog('close');
					}
				}]
	});
	$('#pdailog #startval,#pdailog #endval').numberbox();
	$("#pdailog #ftype").bind("change", function(){
		var o = $(this);
		if(o.val() == 'between'){
			$("#pdailog #endvalspan").css("display","inline");
		}else{
			$("#pdailog #endvalspan").css("display","none");
		}
	});
	$("#pdailog #clear").bind("click", function(){
		$("#pdailog #ftype").val("");
		$("#pdailog #startval").val("");
		$("#pdailog #endval").val("");
	});
}
function kpiExist(kpiId, kpis){
	var ret = false;
	if(!kpis || kpis == null){
		return ret;
	}
	for(var i=0; i<kpis.length; i++){
		if(kpis[i].kpi_id == kpiId){
			ret = true;
			break;
		}
	}
	return ret;
}

function dimExist(dimId, dims){
	var ret = false;
	if(!dims || dims == null){
		return ret;
	}
	for(var i=0; i<dims.length; i++){
		if(dims[i].id == dimId){
			ret = true;
			break;
		}
	}
	return ret;
}

//从表格JSON中删除KPI
function delJsonKpiOrDim(tp){
	var id = curTmpInfo.ckid;
	var compId = curTmpInfo.compId.replace("T", "");
	var comp = findCompById(Number(compId));
	var pos = curTmpInfo.pos;
	if(tp == 'kpi'){
		var kpis = comp.kpiJson;
		var idx = -1;
		for(var i=0; i<kpis.length; i++){
			if(kpis[i].kpi_id == id){
				idx = i;
				break;
			}
		}
		kpis.splice(idx, 1);
	}
	if(tp == 'dim'){
		var dims = null;
		if(pos == 'col'){
			dims = comp.tableJson.cols;
		}else{
			dims = comp.tableJson.rows;
		}
		var idx = -1;
		for(var i=0; i<dims.length; i++){
			if(dims[i].id == id){
				idx = i
				break;
			}
		}
		dims.splice(idx, 1);
		//如果删除维度后无时间维度，并且指标中含有计算指标，需要清除计算指标内容
		if(!isExistDateDim(comp, 'table')){
			for(var j=0; comp.kpiJson&&j<comp.kpiJson.length; j++){
				delete comp.kpiJson[j].compute;
			}
		}
		//如果有参数,并且参数是时间维度，如果参数时间类型表格中没有，移除计算指标
		if(!paramsamedimdate(comp)){
			for(var j=0; comp.kpiJson&&j<comp.kpiJson.length; j++){
				delete comp.kpiJson[j].compute;
			}
		}
	
	}
	curTmpInfo.isupdate = true;
	tableView(comp, compId);
}

function setKpiInfo(ts, id){
	var offset = $(ts).offset();
	//放入临时对象中，方便下次获取
	curTmpInfo.ckid = id;
	curTmpInfo.compId = $(ts).parents(".comp_table").attr("id");
	var comp = findCompById(Number(curTmpInfo.compId.replace("T", "")));
	//设置指标排序的标识
	var kpi = findKpiById(id, comp.kpiJson);
	if(kpi.sort == 'asc'){
		$("#dimoptmenu").menu("setIcon", {target:$("#kpioptmenu").menu("getItem", $("#k_kpi_ord1")).target, iconCls:"icon-ok"});
		$("#dimoptmenu").menu("setIcon", {target:$("#kpioptmenu").menu("getItem", $("#k_kpi_ord2")).target, iconCls:"icon-blank"});
		$("#dimoptmenu").menu("setIcon", {target:$("#kpioptmenu").menu("getItem", $("#k_kpi_ord3")).target, iconCls:"icon-blank"});
	}else if(kpi.sort == 'desc'){
		$("#dimoptmenu").menu("setIcon", {target:$("#kpioptmenu").menu("getItem", $("#k_kpi_ord1")).target, iconCls:"icon-blank"});
		$("#dimoptmenu").menu("setIcon", {target:$("#kpioptmenu").menu("getItem", $("#k_kpi_ord2")).target, iconCls:"icon-ok"});
		$("#dimoptmenu").menu("setIcon", {target:$("#kpioptmenu").menu("getItem", $("#k_kpi_ord3")).target, iconCls:"icon-blank"});
	}else{
		$("#dimoptmenu").menu("setIcon", {target:$("#kpioptmenu").menu("getItem", $("#k_kpi_ord1")).target, iconCls:"icon-blank"});
		$("#dimoptmenu").menu("setIcon", {target:$("#kpioptmenu").menu("getItem", $("#k_kpi_ord2")).target, iconCls:"icon-blank"});
		$("#dimoptmenu").menu("setIcon", {target:$("#kpioptmenu").menu("getItem", $("#k_kpi_ord3")).target, iconCls:"icon-ok"});
	}
	
	$("#kpioptmenu").menu("show", {left:offset.left, top:offset.top + 20});
}

function setCdimInfo(ts, id, name){
	var offset = $(ts).offset();
	//放入临时对象中，方便下次获
	curTmpInfo.ckid = id;
	curTmpInfo.compId = $(ts).parents(".comp_table").attr("id");
	curTmpInfo.pos = "col";
	curTmpInfo.dimname = name;
	//设置聚合菜单
	var issum = false;
	var comp = findCompById(Number(curTmpInfo.compId.replace("T", "")));
	var dims = comp.tableJson.cols;
	for(var i=0; i<dims.length; i++){
		if(dims[i].id == id){
			if(dims[i].issum == 'y'){
				issum = true;
				
			break;
			}
		}
	}
	if(issum){
		var aggr = $("#dimoptmenu").menu("getItem", $("#m_aggre"));
		$("#dimoptmenu").menu("setText", {target:aggr.target, text:"取消聚合"});
	}else{
		var aggr = $("#dimoptmenu").menu("getItem", $("#m_aggre"));
		$("#dimoptmenu").menu("setText", {target:aggr.target, text:"聚合..."});
	}
	//设置移至行、列的文本
	var aggr = $("#dimoptmenu").menu("getItem", $("#m_moveto"));
	$("#dimoptmenu").menu("setText", {target:aggr.target, text:"移至行维度"});
	
	$("#dimoptmenu").menu("show", {left:offset.left, top:offset.top + 20});
}
function setRdimInfo(ts, id, name){
	var offset = $(ts).offset();
	curTmpInfo.ckid = id;
	curTmpInfo.compId = $(ts).parents(".comp_table").attr("id");
	curTmpInfo.pos = "row";
	curTmpInfo.dimname = name;
	
	//设置聚合菜单
	var issum = false;
	var comp = findCompById(Number(curTmpInfo.compId.replace("T", "")));
	var dims = comp.tableJson.rows;
	for(var i=0; i<dims.length; i++){
		if(dims[i].id == id){
			if(dims[i].issum == 'y'){
				issum = true;
				break;
			}
		}
	}
	if(issum){
		var aggr = $("#dimoptmenu").menu("getItem", $("#m_aggre"));
		$("#dimoptmenu").menu("setText", {target:aggr.target, text:"取消聚合"});
	}else{
		var aggr = $("#dimoptmenu").menu("getItem", $("#m_aggre"));
		$("#dimoptmenu").menu("setText", {target:aggr.target, text:"聚合..."});
	}
	//设置移至行、列的文本
	var aggr = $("#dimoptmenu").menu("getItem", $("#m_moveto"));
	$("#dimoptmenu").menu("setText", {target:aggr.target, text:"移至列维度"});
	
	$("#dimoptmenu").menu("show", {left:offset.left, top:offset.top + 20});
}
function updateQDate(ts, compId, tp){
	$('#pdailog').dialog({
		title: '修改数据账期',
		width: 250,
		height: 240,
		closed: false,
		cache: false,
		modal: true,
		toolbar:null,
		buttons:[{
					text:'确定',
					iconCls:"icon-ok",
					handler:function(){
						var comp = findCompById(compId);
						if(tp == 'table'){
							comp.tableJson.baseDate = {"start": $('#pdailog #dft2').val(), "end":$('#pdailog #dft1').val()};
							curTmpInfo.isupdate = true;
							tableView(comp, compId);
						}
						if(tp == 'chart'){
							comp.chartJson.baseDate = {"start": $('#pdailog #dft2').val(), "end":$('#pdailog #dft1').val()};
							curTmpInfo.isupdate = true;
							chartview(comp, compId);
						}
						$('#pdailog').dialog('close');
					}
				},{
					text:'取消',
					iconCls:"icon-cancel",
					handler:function(){
						$('#pdailog').dialog('close');
					}
				}]
	});
	var dft1 = $(ts).attr("ed");
	var dft2 = $(ts).attr("st");
	
	dft1 = dft1.substring(0, 4) + '-' + dft1.substring(4, 6) + "-" + dft1.substring(6, 8);
	dft2 = dft2.substring(0, 4) + '-' + dft2.substring(4, 6) + "-" + dft2.substring(6, 8);
	
	$('#pdailog').dialog('refresh', "DateFilter.action?dimType="+($(ts).attr("dimid") == 1 ? "day" : "month")+"&dimId="+$(ts).attr("dimid")+"&dft1="+dft1+"&dft2="+dft2);
}

function filterDims(){
	var dimid = curTmpInfo.ckid;
	var compId = curTmpInfo.compId.replace("T", "");
	var pos  = curTmpInfo.pos;
	var name = curTmpInfo.dimname;
	//获取组件的JSON对象
	var comp = findCompById(compId);
	var dims = null;
	if(pos == 'col'){
		dims = comp.tableJson.cols;
	}else{
		dims = comp.tableJson.rows;
	}
	var dim = null;
	for(var i=0; i<dims.length; i++){
		if(dims[i].id == dimid){
			dim = dims[i];
			break;
		}
	}
	var vals = [];
	if(dim.vals){
		vals = dim.vals.split(",");
	}
	var isdimExist = function(val){
		var exist = false;
		for(j=0; j<vals.length; j++){
			if(val == vals[j]){
				exist = true;
				break;
			}
		}
		return exist;
	}
	//获取dsource
	var cube = fundCubeById(dim.tid);
	var dset = findDatasetById(cube.datasetid);
	var dsource = findDatasourceById(dset.dsid);
	var ctx = "";
	var selectDim = "";
	var valStr = dim.valStrs ? dim.valStrs.split(",") : [];
	for(j=0; j<vals.length; j++){
		selectDim = selectDim + "<div class=\"checkbox checkbox-info\"><input type=\"checkbox\" id=\"S"+vals[j]+"\" name=\"dimselcet\" value=\""+vals[j]+"\" desc=\""+valStr[j]+"\"><label for=\"S"+vals[j]+"\">"+valStr[j]+"</label></div>";
	}
	ctx = "<div class=\"dxwd\"><div class=\"wdhead\">待选维度</div><input id=\"dimsearch\" style=\"width:230px;\"></input><div class=\"wdlist\" style=\"height:278px;\"></div></div><div class=\"xzwdbtn\"><button type=\"button\" class=\"btn btn-success btn-circle\" id=\"xzwd\" style=\"margin-top:120px;\" title=\"选择\">></button><br/><br/><button type=\"button\" id=\"scwd\" title=\"删除\" class=\"btn btn-success btn-circle\"><</button></div><div class=\"yxwd\"><div class=\"wdhead\">已选维度</div><div class=\"wdlist\">"+selectDim+"</div></div>";
	$('#pdailog').dialog({
		title: name + ' - 维度筛选',
		width: 546,
		height: 410,
		closed: false,
		cache: false,
		modal: true,
		content:ctx,
		buttons:[{
					text:'确定',
					iconCls:'icon-ok',
					handler:function(){
						//获取勾选值
						var vals = "";
						var valStrs = "";
						var seles = $("#pdailog input[name='dimselcet']");
						seles.each(function(a, b){
								vals = vals + $(this).val();
								valStrs = valStrs + $(this).attr("desc");
								if(a != seles.size() - 1){
								   vals = vals + ',';
								   valStrs = valStrs + ",";
								}
						});
						dim.vals = vals;
						dim.valStrs = valStrs;
						curTmpInfo.isupdate = true;
						tableView(comp, compId);
						$('#pdailog').dialog('close');
					}
				},{
					text:'取消',
					iconCls:'icon-cancel',
					handler:function(){
						$('#pdailog').dialog('close');
					}
				}]
	});
	//加载维度数据
	if(dim.tableColKey == '' || dim.tableName == '' || dim.tableColName == ''){
		loadDimFunc2(cube, dsource, dim, ""); 
	}else{
		loadDimFunc(cube, dsource, dim, "");
	}
	//注册维度选择事件
	$("#pdailog #xzwd").click(function(){
		var ls = $("#pdailog input[name='dimselcet']");
		var isExist = function(val){
			var exist =false;
			for(i=0;i<ls.size(); i++){
				if($(ls.get(i)).val() == val){
					exist = true;
					break;
				}
			}
			return exist;
		}
		$("#pdailog input[name='dimval']:checkbox:checked").each(function(index, element) {
			if(!isExist($(element).val())){
				var str = "<div class=\"checkbox checkbox-info\"><input type=\"checkbox\" desc=\""+$(element).attr("desc")+"\" value=\""+$(element).val()+"\" name=\"dimselcet\" id=\"S"+$(element).val()+"\"><label for=\"S"+$(element).val()+"\">"+$(element).attr("desc")+"</label></div>";
				$("#pdailog .yxwd .wdlist").append(str);
			}
        });
	});
	//注册维度删除事件
	$("#pdailog #scwd").click(function(){
		$("#pdailog input[name='dimselcet']:checkbox:checked").each(function(index, element) {
            $(element).parent().remove();
        });
	});
	//搜索按钮
	$("#pdailog #dimsearch").searchbox({
		searcher:function(value,name){
			if(dim.tableName == '' || dim.tableColKey == '' || dim.tableColName == ''){
				loadDimFunc2(cube, dsource, dim, value);
			}else{
				loadDimFunc(cube, dsource, dim, value);
			}
		},
		prompt:'维度搜索...'
	});
}
function kpisort(tp){
	var kpiId = curTmpInfo.ckid;
	var compId = curTmpInfo.compId.replace("T", "");
	var comp = findCompById(compId);
	for(i=0; i<comp.kpiJson.length; i++){
		if(comp.kpiJson[i].kpi_id == kpiId){
			comp.kpiJson[i].sort = tp;
		}else{
			comp.kpiJson[i].sort = '';
		}
	}
	curTmpInfo.isupdate = true;
	tableView(comp, compId);
}
function dimsort(tp){
	var dimid = curTmpInfo.ckid;
	var compId = curTmpInfo.compId.replace("T", "");
	var pos  = curTmpInfo.pos;
	var name = curTmpInfo.dimname;
	//获取组件的JSON对象
	var comp = findCompById(compId);
	var dims = null;
	if(pos == 'col'){
		dims = comp.tableJson.cols;
	}else{
		dims = comp.tableJson.rows;
	}
	for(var i=0; i<dims.length; i++){
		if(dims[i].id == dimid){
			dims[i].dimord = tp;
			break;
		}
	}
	//进行维度排序时，清除指标的排序信息
	for(i=0; i<comp.kpiJson.length; i++){
		comp.kpiJson[i].sort = '';
	}
	curTmpInfo.isupdate = true;
	tableView(comp, compId);
	$("#dimoptmenu").menu("hide")
}
//维度交换行列
function dimexchange(){
	var dimid = curTmpInfo.ckid;
	var compId = curTmpInfo.compId.replace("T", "");
	var pos  = curTmpInfo.pos;
	var name = curTmpInfo.dimname;
	//获取组件的JSON对象
	var comp = findCompById(compId);
	
	if(pos == 'col'){
		//先移除维度
		var idx = 0;
		var tmp = null;
		var dims = comp.tableJson.cols;
		for(var i=0; i<dims.length; i++){
			if(dims[i].id == dimid){
				idx = i;
				tmp = dims[i];
				break;
			}
		}
		//如果维度有分组，分组必须相同
		var group = tmp.grouptype;
		if(group != null && findGroup(comp.tableJson.cols, group, tmp)){
			msginfo("移动失败，同一分组的维度必须在同一行/列标签。");
			return;
		}
		comp.tableJson.cols.splice(idx, 1);
		//再添加维度
		comp.tableJson.rows.push(tmp);
	}
	if(pos == 'row'){
		//先移除维度
		var idx = 0;
		var tmp = null;
		var dims = comp.tableJson.rows;
		for(var i=0; i<dims.length; i++){
			if(dims[i].id == dimid){
				idx = i;
				tmp = dims[i];
				break;
			}
		}
		//如果维度有分组，分组必须相同
		var group = tmp.grouptype;
		if(group != null && findGroup(comp.tableJson.rows, group, tmp)){
			msginfo("移动失败，同一分组的维度必须在同一行/列标签。");
			return;
		}
		comp.tableJson.rows.splice(idx, 1);
		//再添加维度
		comp.tableJson.cols.push(tmp);
	}
	curTmpInfo.isupdate = true;
	tableView(comp, compId);
}
function changecolrow(islink){
	var compId = curTmpInfo.compId.replace("T", "");
	var comp = findCompById(compId);
	var tmp = comp.tableJson.rows;
	comp.tableJson.rows = comp.tableJson.cols;
	comp.tableJson.cols = tmp;
	tableView(comp, compId);
	//判断是否联动
	if(comp.complink && islink){
		//联动图形
		var chartComp = findCompById(comp.complink);
		if(chartComp != null && isSameDimsInDrill(comp, chartComp)){
			exchangexs(chartComp.id, false); //存在相同维度才能联动
		}
	}
}
function dimmove(tp){
	var dimid = curTmpInfo.ckid;
	var compId = curTmpInfo.compId.replace("T", "");
	var pos  = curTmpInfo.pos;
	var name = curTmpInfo.dimname;
	//获取组件的JSON对象
	var comp = findCompById(compId);
	var dims = null;
	if(pos == 'col'){
		dims = comp.tableJson.cols;
	}else{
		dims = comp.tableJson.rows;
	}
	if(dims.length <= 1){
		msginfo('无效移动。');
		return;
	}
	for(var i=0; i<dims.length; i++){
		if(dims[i].id == dimid){
			if(tp == 'left'){
				if(i <= 0){
					msginfo('无效移动。');
					return;
				}else{
					var tp = dims[i - 1];
					dims[i - 1] = dims[i];
					dims[i] = tp;
					curTmpInfo.isupdate = true;
					tableView(comp, compId);
					$("#dimoptmenu").menu("hide");
					return;
				}
			}else
			if(tp == 'right'){
				if( i >= dims.length - 1){
					msginfo('无效移动。');
					return;
				}else{
					var tp = dims[i + 1];
					dims[i + 1] = dims[i];
					dims[i] = tp;
					curTmpInfo.isupdate = true;
					tableView(comp, compId);
					$("#dimoptmenu").menu("hide");
					return;
				}
			}
			break;
		}
	}
}
//tp表示是提示信息还是错误信息
function msginfo(input, tp){
	var str = null;
	if(tp && (tp == 'suc' || tp == 'info' )){
		str = "<div class='msginfo msgsuc'>" + input +"</div>";
	}else{
		str = "<div class='msginfo msgerr'>" + input+"</div>";
	}
	var tt = "出错了";
	if(tp && tp == 'suc'){
		tt = '成功了';
	}else if(tp && tp == 'info'){
		tt = '提示信息';
	}
	$.messager.show({
		title: tt,
		msg:str,
		showType:'fade',
		timeout:2000,
		style:{
			right:'',
			top:document.body.scrollTop+document.documentElement.scrollTop + 10,
			bottom:''
		}
	});
}
function showmsg(msg){
	var ctx = "<div class=\"textpanel\" style=\"margin:25px;\"><div class='msginfo msgsuc'>" + msg +"</div></div>";
	$('#pdailog').dialog({
		title: '提示信息',
		width: 300,
		height: 180,
		closed: false,
		cache: false,
		modal: true,
		toolbar:null,
		content: ctx,
		buttons:[{
					text:'确定',
					iconCls:"icon-ok",
					handler:function(){
						$('#pdailog').dialog('close');
					}
				}]
	});
}
function findDimById(dimId, dims){
	var ret = null;
	if(!dims || dims == null){
		return ret;
	}
	for(var i=0; i<dims.length; i++){
		if(dims[i].id == dimId){
			ret = dims[i];
			break;
		}
	}
	return ret;
}
function findKpiById(kpiId, kpis){
	var ret = null;
	if(!kpis || kpis == null){
		return ret;
	}
	for(var i=0; i<kpis.length; i++){
		if(kpis[i].kpi_id == kpiId){
			ret = kpis[i];
			break;
		}
	}
	return ret;
}
function findParamById(pid){
	var ret = null;
	for(i=0; pageInfo.params&&i<pageInfo.params.length; i++){
		var p = pageInfo.params[i];
		if(p.id == pid){
			ret = p;
			break;
		}
	}
	return ret;
}
function kpiproperty(){
	var kpiId = curTmpInfo.ckid;
	var compId = curTmpInfo.compId.replace("T", "");
	var comp = findCompById(compId);
	var kpi = findKpiById(kpiId, comp.kpiJson);
	var cube = fundCubeById(kpi.tid);
	var cubeKpi = findCubeKpiById(cube, kpiId);
	var ctx = "<div class=\"textpanel\"><span class=\"inputtext\">度量名称：</span>"+kpi.kpi_name+"<br><span class=\"inputtext\">所属表/字段：</span>"+kpi.tname+" / "+kpi.col_name+"<br><span class=\"inputtext\">度量单位：</span><select id=\"kpiunit\" name=\"kpiunit\" class=\"inputform2\"><option value='1'></option><option value='1000'>千</option><option value='10000'>万</option><option value='1000000'>百万</option><option value='100000000'>亿</option></select>"+(kpi.unit?kpi.unit:"")+"<br><span class=\"inputtext\">格 式 化：</span>"+
		"<select id=\"fmt\" name=\"fmt\" class=\"inputform2\"><option value=\"\"></option><option value=\"###,##0\">整数</option><option value=\"###,##0.00\">小数</option><option value=\"0.00%\">百分比</option></select><br/><span class=\"inputtext\">度量解释：</span>"+(cubeKpi.kpinote?unescape(cubeKpi.kpinote):"无")+"</div>";
	$('#pdailog').dialog({
		title: '度量属性',
		width: 350,
		height: 265,
		closed: false,
		cache: false,
		modal: true,
		toolbar:null,
		content: ctx,
		buttons:[{
					text:'确定',
					iconCls:"icon-ok",
					handler:function(){
						kpi.fmt = $("#pdailog #fmt").val();
						//kpi.aggre = $("#pdailog #aggreType").val();
						kpi.rate = Number($("#pdailog #kpiunit").val());
						$('#pdailog').dialog('close');
						curTmpInfo.isupdate = true;
						tableView(comp, compId);
					}
				},{
					text:'取消',
					iconCls:"icon-cancel",
					handler:function(){
						$('#pdailog').dialog('close');
					}
				}]
	});
	//让格式化、聚合方式选中
	$("#pdailog #fmt").find("option[value='"+kpi.fmt+"']").attr("selected",true);
	$("#pdailog #kpiunit").find("option[value='"+kpi.rate+"']").attr("selected",true);
}
//添加维度聚合项
function aggreDim(){
	var dimid = curTmpInfo.ckid;
	var compId = curTmpInfo.compId.replace("T", "");
	var pos  = curTmpInfo.pos;
	var name = curTmpInfo.dimname;
	var comp = findCompById(compId);
	var dims = null;
	if(pos == 'col'){
		dims = comp.tableJson.cols;
	}else{
		dims = comp.tableJson.rows;
	}
	var dim = null;
	for(var i=0; i<dims.length; i++){
		if(dims[i].id == dimid){
			dim = dims[i];
		}
	}
	if(dim.issum == 'y'){
		dim.issum = "n";
		delete dim.aggre;
		curTmpInfo.isupdate = true;
		tableView(comp, compId);
		return;
	}
	
	var ctx = "<div style='line-height:30px; margin:20px 20px 20px 40px;'>聚合方式：<select id=\"dimaggre\" name=\"dimaggre\" class=\"inputform2\"><option value=\"sum\">求和</option><option value=\"count\">计数</option><option value=\"avg\">平均</option><option value=\"max\">最大</option><option value=\"min\">最小</option><option value=\"var\">方差</option><option value=\"sd\">标准差</option><option value=\"middle\">中位数</option></select></div>";
	$('#pdailog').dialog({
		title: '维度聚合',
		width: 280,
		height: 180,
		closed: false,
		cache: false,
		modal: true,
		toolbar:null,
		content: ctx,
		buttons:[{
					text:'确定',
					iconCls:'icon-ok',
					handler:function(){
						if(dim.issum == 'y'){
							dim.issum = "n";
							delete dim.aggre;
						}else{
							dim.issum = 'y';
							dim.aggre = $("#pdailog #dimaggre").val();
						}
						curTmpInfo.isupdate = true;
						tableView(comp, compId);
						$('#pdailog').dialog('close');
					}
				},{
					text:'取消',
					iconCls:'icon-cancel',
					handler:function(){
						$('#pdailog').dialog('close');
					}
				}]
	});
}
//管理员共享报表，共享后其他人员都能查看
function shareReport(tp){
	var node = $("#myreporttree").tree("getSelected");
	if(node.attributes.share == "y" && tp == 'y'){
		return;
	}
	if(node.attributes.share != "y" && tp == 'n'){
		return;
	}
	if(confirm("是否"+(tp=="n"?"取消":"")+"共享？")){
		$.ajax({
			type:'post',
			dataType:'json',
			url: tp=="y"?"MyReport!share.action":"MyReport!unshare.action",
			data: {reportId:node.id},
			success: function(dt){
				//更新报表
				loadMyReportTree();
			}
		});
	}
}
//打印页面
function printData(){
	resortComp();
	for(i=0; i<pageInfo.comps.length; i++){
		if(pageInfo.comps[i].type != 'text' && pageInfo.comps[i].kpiJson == undefined){
			msginfo("组件中无数据，请先查询数据。");
			$('#pdailog').dialog('close');
			return;
		}
		if(pageInfo.comps[i].type == 'table'){
			pageInfo.comps[i].tableJson.cols.push({"type":"kpiOther","id":"kpi"});
		}
	}
	var json =  JSON.stringify(pageInfo);
	//移除kpiOther
	for(i=0; i<pageInfo.comps.length; i++){
		if(pageInfo.comps[i].type == 'table'){
			pageInfo.comps[i].tableJson.cols.pop();
		}
	}
	var url2 = "about:blank";
	var name = "printwindow";
	window.open(url2, name);
	var ctx = "<form name='prtff' method='post' target='printwindow' action=\"ReportDesign!print.action\" id='expff'><input type='hidden' name='pageInfo' id='pageInfo' value='"+json+"'></form>";
	$(ctx).appendTo("body").submit().remove();
}
//导出页面
function exportPage(){
	var ctx = "<form name='expff' method='post' action=\"ReportExport.action\" id='expff'><input type='hidden' name='type' id='type'><input type='hidden' name='json' id='json'><div class='exportpanel'><span class='exptp select' tp='html'><img src='../resource/img/export-html.gif'><br>HTML</span>"+
			"<span class='exptp' tp='csv'><img src='../resource/img/export-csv.gif'><br>CSV</span>" +
			"<span class='exptp' tp='excel'><img src='../resource/img/export-excel.gif'><br>EXCEL</span>" + 
			"<span class='exptp' tp='pdf'><img src='../resource/img/export-pdf.gif'><br>PDF</span></div></form>";
	$('#pdailog').dialog({
		title: '导出数据',
		width: 310,
		height: 200,
		closed: false,
		cache: false,
		modal: true,
		toolbar:null,
		content: ctx,
		buttons:[{
					text:'确定',
					iconCls:"icon-ok",
					handler:function(){
						resortComp();
						var tp = curTmpInfo.expType;
						$("#expff #type").val(tp);
						//给表格组件添加kpiOther
						for(i=0; i<pageInfo.comps.length; i++){
							if(pageInfo.comps[i].type != 'text' && pageInfo.comps[i].kpiJson == undefined){
								msginfo("组件中无数据，请先查询数据。");
								$('#pdailog').dialog('close');
								return;
							}
							if(pageInfo.comps[i].type == 'table'){
								pageInfo.comps[i].tableJson.cols.push({"type":"kpiOther","id":"kpi"});
							}
						}
						$("#expff #json").val(JSON.stringify(pageInfo));
						//移除kpiOther
						for(i=0; i<pageInfo.comps.length; i++){
							if(pageInfo.comps[i].type == 'table'){
								pageInfo.comps[i].tableJson.cols.pop();
							}
						}
						
						$("#expff").submit();
						$('#pdailog').dialog('close');
					}
				},{
					text:'取消',
					iconCls:"icon-cancel",
					handler:function(){
						$('#pdailog').dialog('close');
					}
				}]
	});
	curTmpInfo.expType = "html";
	//注册事件
	$(".exportpanel span.exptp").click(function(e) {
		$(".exportpanel span.exptp").removeClass("select");
        $(this).addClass("select");
		curTmpInfo.expType = $(this).attr("tp");
    });
}
function kpidesc(){
	var s = "";
	if(pageInfo.selectDs && pageInfo.selectDs!=''){
		var cubes = pageInfo.selectDs.split(",");
		var dt = [];
		for(i=0;i<cubes.length;i++){
			var cube = fundCubeById(cubes[i]);
			if(cube == null){ //当前立方体已经被删除了
				continue;
			}
			for(j=0; j<cube.kpi.length; j++){
				s=s+"<tr><td class='kpiData1 grid3-td' align=\"left\">"+cube.kpi[j].name+"</td><td class='kpiData1 grid3-td' align=\"left\" style=\"color:#666\">"+(cube.kpi[j].kpinote?unescape(cube.kpi[j].kpinote):"")+"</td></tr>";
			}
		}
	}
	var ctx = "<table class=\"grid3\" id=\"T_report54\" cellpadding=\"0\" cellspacing=\"0\"><tr style=\"background-color:#FFF\"><th width='30%'>度量</th><th>解释信息</th></tr>"+s+"</table>";
	$('#pdailog').dialog({
		title: '度量指标解释',
		width: 530,
		height: 300,
		closed: false,
		cache: false,
		modal: true,
		toolbar:null,
		content: ctx,
		buttons:[{
					text:'关闭',
					iconCls:"icon-ok",
					handler:function(){
						$('#pdailog').dialog('close');
					}
				}]
	});
}
function helper(){
	var ctx = "<div style=\"line-height:20px; margin:5px; font-size:13px;\"> &nbsp; &nbsp; 专业的在线数据分析软件，产品简单易用，功能强大，用户不用编写任何代码，只用通过简单配置即可查询和分析数据；支持表格、图形、文本等多种展现方式；支持下钻、上卷、钻透、排序、过滤、求和、同环比计算等分析方法；成本低廉，是您企业数据分析的理想工具。 <br/> <b>表格展现：</b><br/> <img src=\"../resource/img/help1.gif\"> <br/> <b>表格钻取：</b><br/> <img src=\"../resource/img/help4.gif\">  <br/> <b>创建图形：</b><br/> <img src=\"../resource/img/help2.gif\">  <br/> <b>图形展现：</b><br/> <img src=\"../resource/img/help3.gif\">  <br/> <a href='http://www.ruisitech.com/doc/rsbi_jjb.pdf' target='_blank'>用户使用手册</a> <br/> <b>北京睿思科技有限公司</b> 版权所有 </div>";
	$('#pdailog').dialog({
		title: '睿思BI|OLAP工具使用帮助',
		width: 630,
		height: 420,
		closed: false,
		cache: false,
		modal: true,
		toolbar:null,
		content: ctx,
		buttons:[{
					text:'关闭',
					iconCls:"icon-ok",
					handler:function(){
						$('#pdailog').dialog('close');
					}
				}]
	});
}
function initOptareaWidth(){
	var h = $(window).height() - 170 ;
	$("#optarea").css("height", h + "px");
	$(window).resize(function(){
		var h = $(window).height() - 170 ;
		$("#optarea").css("height", h + "px");
	});
}
function showloading(){
	var sload = $('#loadingdiv');
	if(sload.size() == 0){
		sload = $('<div id="loadingdiv" class="sk-spinner sk-spinner-three-bounce" style="position:absolute;z-index:9999"><div class="sk-bounce1"></div><div class="sk-bounce2"></div><div class="sk-bounce3"></div></div>').appendTo('body');
	}
	var doc = $(document);
	var win = $(window);
	var t = doc.scrollTop() + win.height()/2 - 50;
	var l = doc.scrollLeft() + win.width()/2 - 50;
	sload.css({'top':t, 'left':l});
	sload.show();
}
function hideLoading(){
	$("#loadingdiv").remove();
}