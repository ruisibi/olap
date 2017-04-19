if($ == undefined){
	$ = jQuery;
}
function initpage(){
	$("#l_tab").tabs({fit:true,border:false});
	//初始化数据选项
	initselectDataTree();
	//初始化datatree(数据中心)
	initmydatatree();
	//初始化报表选项卡
	loadMyReportTree();
	//初始化参数
	initparam();
	
	//创建明细表
	crtTable();
	if(pageInfo.grid && pageInfo.grid.cols && pageInfo.grid.cols.length > 0){
		gridView(pageInfo.grid);
	}
	//初始化图形
	if(pageInfo.chart && pageInfo.chart.kpiJson && pageInfo.chart.kpiJson.length > 0){
		var c = pageInfo.chart;
		addChart(c.chartJson.type, c);
	}
	
	//初始化按钮图标颜色
	$("table.grid5 tr.scrollColThead th span a.extKpibtn,.comp_table .title .ticon a,span.chartdel").live("mouseover", function(){
		$(this).css("opacity", 1);
	}).live("mouseout", function(){
		$(this).css("opacity", 0.6);
	});
	
}
//初始化参数
function initparam(){
	//回写参数值
	if(pageInfo.params && pageInfo.params.length>0){
		$("#optarea #p_param div.ptabhelpr").remove();
		$("#optarea #p_param").append("<b>参数： </b>");
		for(i=0; i<pageInfo.params.length; i++){
			var obj = $("#optarea #p_param");
			var p = pageInfo.params[i];
			var str = "<span class=\"pppp\" id=\"pa_"+p.id+"\"><span title=\"筛选\" onclick=\"paramFilter('"+p.id+"', '"+p.type+"', '"+(p.dispName!=""?p.dispName:p.name)+"')\" class=\"text\">"+dispalyParamName(p)+"</span><a class=\"one_p\" title=\"删除\" onclick=\"deleteParam('"+p.id+"')\" href=\"javascript:;\" style=\"opacity: 0.6;\"> &nbsp; </a></span>";
			obj.append(str);
		}
	}
	//注册接收维度拖拽事件
	$("#optarea #p_param").droppable({
		accept:"#selectdatatree .tree-node",
		onDragEnter:function(e,source){
			var node = $("#selectdatatree").tree("getNode", source);
			$(source).draggable('proxy').find("span").removeClass("tree-dnd-no");
			$(source).draggable('proxy').find("span").addClass("tree-dnd-yes");
			$(this).css("border", "1px solid #ff0000");
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
			if(!pageInfo.params){
				pageInfo.params = [];
			}
			var ps = pageInfo.params;
			var target = findParamById(node.id);
			if(target != null){
				msginfo("参数"+node.text+"已经存在。");
				return;
			}
			var p = {id:node.id,name:node.attributes.name,tname:node.attributes.tname,type:node.attributes.type,dispName:node.attributes.dispName,datasetid:node.attributes.tid,expression:node.attributes.expression};
			ps.push(p);
			
			var obj = $(this);
			obj.find("div.ptabhelpr").remove();
			if(obj.find("b").size() == 0){
				obj.append("<b>参数： </b>");
			}
			obj.append("<span class=\"pppp\" id=\"pa_"+p.id+"\"><span title=\"筛选\" onclick=\"paramFilter('"+p.id+"', '"+p.type+"','"+node.text+"')\" class=\"text\">"+node.text+"(无)</span><a class=\"one_p\" title=\"删除\" onclick=\"deleteParam('"+p.id+"')\" href=\"javascript:;\" style=\"opacity: 0.6;\"> &nbsp; </a></span>");
			paramFilter(p.id, p.type, node.text);
		}
	});
}
function deleteParam(id){
	$("#optarea #p_param #pa_" + id).remove();
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
		$("#optarea #p_param").html("<div class=\"ptabhelpr\">拖拽维度到此处作为页面参数</div>");
	}
	gridView(pageInfo.grid);
	chartview(pageInfo.chart);
}
function paramFilter(id, type, name){
	var w = 320;
	var h = 200;
	var param = findParamById(id);
	var ft = param.filter;
	var ctx = "";
	if(type == "Double" || type == "Int"){
		ctx = "<div style='line-height:25px; margin:5px;'><br/> "+name+"： &nbsp; <select id=\"ftype\"><option value=\"\"></option><option value=\">\" "+(ft&&ft.filterType==">"?"selected":"")+">大于</option><option value=\">=\" "+(ft&&ft.filterType==">="?"selected":"")+">大于等于</option><option value=\"<\" "+(ft&&ft.filterType=="<"?"selected":"")+">小于</option><option value=\"<=\" "+(ft&&ft.filterType=="<="?"selected":"")+">小于等于</option><option value=\"=\" "+(ft&&ft.filterType=="="?"selected":"")+">等于</option><option value=\"!=\" "+(ft&&ft.filterType=="!="?"selected":"")+">不等于</option><option value=\"between\" "+(ft&&ft.filterType=="between"?"selected":"")+">区间</option></select> &nbsp; <input type=\"text\" id=\"startval\" size=\"5\" value=\""+(ft?ft.val1:"")+"\"><span id=\"endvalspan\" style=\"display:"+(ft&&ft.filterType=='between'?"inline":"none")+"\"> and <input type=\"text\" id=\"endval\" size=\"5\" value=\""+(ft?ft.val2:"")+"\"></span></div>";
	}else
	if(type == "String"){
		ctx = "<div style='line-height:25px; margin:5px;'><br/> "+name+"：<select id=\"ftype\"><option value=\"\"></option><option value=\"=\" "+(ft&&ft.filterType=="="?"selected":"")+">等于</option><option value=\"!=\" "+(ft&&ft.filterType=="!="?"selected":"")+">不等于</option><option value=\"like\" "+(ft&&ft.filterType=="like"?"selected":"")+">包含</option></select> &nbsp; <input type=\"text\" id=\"val1\" size=\"13\" value=\""+(ft?ft.val1:"")+"\"> </div>";
	}else{
		ctx = "<div style='line-height:25px; margin:5px;'><input type='hidden' id='ftype' value='between'><br/> 开始时间：  <input type=\"text\" size=\"20\" id=\"stdt\"  readonly=\"true\" value=\""+(ft&&ft.stdt?ft.stdt:"")+"\" onclick=\"WdatePicker({dateFmt:'yyyy-MM-dd'})\" class=\"Wdate\"><br/><br/>  结束时间： <input type=\"text\" size=\"20\" id=\"enddt\"  readonly=\"true\" onclick=\"WdatePicker({dateFmt:'yyyy-MM-dd'})\" class=\"Wdate\" value=\""+(ft&&ft.enddt?ft.enddt:"")+"\"><br/>  </div>";
	}
	$('#pdailog').dialog({
		title: name+' - 参数值筛选',
		width: w,
		height: h,
		closed: false,
		cache: false,
		modal: true,
		content: ctx,
		buttons:[{
				text:'确定',
				handler:function(){
					var ft = $("#pdailog #ftype").val();
					if(ft == ""){
						msginfo("请选择筛选条件!");
						return;
					}
					if(type=="Double" || type == "Int"){
						var sv = $("#pdailog #startval").val();
						var ev = $("#pdailog #endval").val();
						if(sv == ""){
							msginfo("请录入筛选值!");
							return;
						}
						var filter = {"filterType":ft,"val1":Number(sv),"val2":(ev == ""?0:Number(ev))};
						param.filter = filter;
					}else if(type == "String"){
						var val = $("#pdailog #val1").val();
						if(val == ""){
							msginfo("请录入筛选值!");
							return;
						}
						var filter = {"filterType":ft,"val1":val};
						param.filter = filter;
					}else if(type == "Date"){
						var stdt = $("#pdailog #stdt").val();
						var enddt = $("#pdailog #enddt").val();
						if(stdt == "" || enddt == ""){
							msginfo("请选择开始时间及结束时间!");
							return;
						}
						var filter = {"filterType":"between","stdt":stdt, "enddt": enddt};
						param.filter = filter;
					}
					$("#p_param #pa_"+param.id+" span").text(dispalyParamName(param));
					$('#pdailog').dialog('close');
					curTmpInfo.isupdate = true;
					
					gridView(pageInfo.grid);
					chartview(pageInfo.chart);
				}
			},{
				text:'取消',
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
function dispalyParamName(param){
	var tp = param.type;
	var filter = param.filter;
	if(!filter){
		return param.dispName==""?param.name:param.dispName;
	}
	if((tp == "Int" || tp == "Double") && filter.filterType=="between"){
		return ((param.dispName==""?param.name:param.dispName)+"("+filter.filterType + " "+filter.val1 + " and " + filter.val2+" )");
	}else if(tp == "String" && filter.filterType=="like"){
		return ((param.dispName==""?param.name:param.dispName)+"(包含 "+filter.val1+")");
	}else if(tp == "Date"){
		return ((param.dispName==""?param.name:param.dispName)+"("+filter.stdt+"到"+filter.enddt+")");
	}else{
		return ((param.dispName==""?param.name:param.dispName)+"("+filter.filterType+filter.val1+")");
	}
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
	var jsonStr = JSON.stringify(pageInfo);
	if(jsonStr == "{}"){
		msginfo("没有需要保存的内容！");
		return
	}
	var pageId = pageInfo.id;
	if(pageId == undefined || pageId == null){
		pageId = "";
	}
	if(pageId == ''){ //未保存过，提示用户输入名称
		$.messager.prompt('提示信息', '请输入您要保存的文件名称：', function(r){
			if (r){
				$.post("Report!save.action", {"pageInfo": jsonStr, "pageId":pageId, "pageName" : r, "view":view}, function(resp){
					pageInfo.id = resp;
					if(cb != undefined){
						cb();
					}else{
						
					}
					//刷新myreport数
					loadMyReportTree();
					msginfo("保存成功！", "suc");
					//更新页面为未修改
					curTmpInfo.isupdate = false;
				});
			}
		});
		$(".messager-input").focus();
	}else{ //已经保存过，直接update
		$.post("Report!save.action", {"pageInfo": jsonStr, "pageId":pageId, "view":view}, function(resp){
			pageInfo.id = resp;
			if(cb != undefined){
				cb();
			}else{
			}
			if(!nomsg || nomsg ==false){
				msginfo("保存成功！", "suc");
			}
			//更新页面为未修改
			curTmpInfo.isupdate = false;
		});
	}
} 
//另存
function saveas(view){
	var jsonStr = JSON.stringify(pageInfo);
	$.messager.prompt('提示信息', '请输入您要另存的文件名称：', function(r){
		if (r){
			$.post("Report!save.action", {"pageInfo": jsonStr, "pageId":'', "pageName" : r, "view":view}, function(resp){
				//刷新myreport数
				loadMyReportTree();
				msginfo("保存成功！", "suc");
			});
		}
	});
	$(".messager-input").focus();
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
				handler:function(){
					var r = $("input[name=\"reportId\"]:checked").val();
					if(!r || r == null){
						msginfo("请至少选择一个报表！");
						return;
					}
					$('#pdailog').dialog('close');
					var url = (view?"Report!view.action":"Report.action") + '?pageId='+r;
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
				handler:function(){
					$('#pdailog').dialog('close');
				}
			}]
	});
	$('#pdailog').dialog('refresh', 'MyReport!list.action?view='+curTmpInfo.view+"&t="+Math.random());
}
//view 表示当前是 view 状态
function newpage(view){
	var url = view?"Report!view.action":"Report.action";
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
function loadMyReportTree(){
	$('#myreporttree').tree({
		url:'MyReport!tree.action?view='+curTmpInfo.view,
		dnd:false,
		onDblClick:function(node){
			//alert(node.id);
			if(node.id == "sharereport"){
				return;
			}
			location.href = (curTmpInfo.view?'Report!view.action':'Report.action') + '?pageId='+node.id;
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
function crtTable(){
	var ctx = "<div class=\"title\"><div class=\"tname\">明细查询</div><div class=\"mvcomp\"></div><div class=\"ticon\"><a href=\"javascript:;\" id=\"removetablebtn\" title=\"删除对象\"></a></div></div><div class=\"ctx\"><table class=\"d_table\"><tbody><tr><th><div class=\"tabhelpr\" id=\"d_colDims\">将字段拖入此处查询</div></th></tr><tr><td class=\"onesel\">  </td></tr><tr><td  class=\"onesel2\">  </td></tr><tr><td class=\"onesel\">  </td></tr><tr><td class=\"onesel2\"> </td></tr><tr><td class=\"onesel\"> </td></tr></tbody></table></div>";
	$("#T2").html(ctx);
	$("#removetablebtn").click(function(){
		$("#T2").html("<div align=\"center\"><a href='javascript:;' id='addtablebtn'><img border='0' src='../resource/img/add.png' style='margin:5px;'></a></div>");
		delete pageInfo.grid;
		$("#addtablebtn").click(function(){
			crtTable();
		});
	});
	//注册接受拖拽事件
	fireDropEvent();
}
function fireDropEvent(){
	$("#T2 #d_colDims").droppable({
		accept:"#selectdatatree .tree-node",
		onDragEnter:function(e,source){
			$(source).draggable('proxy').find("span").removeClass("tree-dnd-no");
			$(source).draggable('proxy').find("span").addClass("tree-dnd-yes");
			$("#T2 #d_colDims").css("border", "1px solid #ff0000");
			e.cancelBubble=true;
			e.stopPropagation(); //阻止事件冒泡
		},
		onDragLeave:function(e,source){
			$(source).draggable('proxy').find("span").addClass("tree-dnd-no");
			$(source).draggable('proxy').find("span").removeClass("tree-dnd-yes");
			$("#T2 #d_colDims").css("border", "none");
			e.cancelBubble=true;
			e.stopPropagation(); //阻止事件冒泡
		},
		onDrop:function(e,source){
			$("#T2 #d_colDims").css("border", "none");
			e.cancelBubble=true;
			e.stopPropagation(); //阻止事件冒泡
			
			var grid = pageInfo.grid;
			if(!grid){
				pageInfo.grid = grid = {cols:[]};
			}
			//获取TREE
			var node = $("#selectdatatree").tree("getNode", source);
			if(grid.datasetid && grid.datasetid != node.attributes.tid){
				msginfo("你拖入的字段"+node.text+"与表格已有的内容不在同一个数据集中，拖放失败！");
				return;
			}else{
				grid.datasetid = node.attributes.tid;
			}
			//判断是否存在
			var exist = function(gid){
				var r = false;
				for(j=0; j<grid.cols.length; j++){
					if(grid.cols[j].id == gid){
						r = true;
						break;
					}
				}
				return r;
			};
			if(exist(node.id)){
				msginfo("您拖拽的字段 " + node.text+" 已经存在。");
				return;
			}
			grid.cols.push({id:node.id,name:node.attributes.name,tname:node.attributes.tname,type:node.attributes.type,dispName:node.attributes.dispName,fmt:node.attributes.fmt,expression:node.attributes.expression});
			gridView(grid);
			curTmpInfo.isupdate = true;
		}
	});
}
function optTableCol(ts, id){
	var offset = $(ts).offset();
	curTmpInfo.colId = id;
	var col = findColById(id);
	if(col.sort == 'asc'){
		$("#gridoptmenu").menu("setIcon", {target:$("#gridoptmenu").menu("getItem", $("#col_ord1")).target, iconCls:"icon-ok"});
		$("#gridoptmenu").menu("setIcon", {target:$("#gridoptmenu").menu("getItem", $("#col_ord2")).target, iconCls:"icon-blank"});
		$("#gridoptmenu").menu("setIcon", {target:$("#gridoptmenu").menu("getItem", $("#col_ord3")).target, iconCls:"icon-blank"});
	}else if(col.sort == 'desc'){
		$("#gridoptmenu").menu("setIcon", {target:$("#gridoptmenu").menu("getItem", $("#col_ord1")).target, iconCls:"icon-blank"});
		$("#gridoptmenu").menu("setIcon", {target:$("#gridoptmenu").menu("getItem", $("#col_ord2")).target, iconCls:"icon-ok"});
		$("#gridoptmenu").menu("setIcon", {target:$("#gridoptmenu").menu("getItem", $("#col_ord3")).target, iconCls:"icon-blank"});
	}else{
		$("#gridoptmenu").menu("setIcon", {target:$("#gridoptmenu").menu("getItem", $("#col_ord1")).target, iconCls:"icon-blank"});
		$("#gridoptmenu").menu("setIcon", {target:$("#gridoptmenu").menu("getItem", $("#col_ord2")).target, iconCls:"icon-blank"});
		$("#gridoptmenu").menu("setIcon", {target:$("#gridoptmenu").menu("getItem", $("#col_ord3")).target, iconCls:"icon-ok"});
	}
	$("#gridoptmenu").menu("show", {left:offset.left, top:offset.top + 19});
}
function findColById(id){
	var ret = null;
	for(i=0; pageInfo.grid&&pageInfo.grid.cols&&i<pageInfo.grid.cols.length; i++){
		if(pageInfo.grid.cols[i].id == id){
			ret = pageInfo.grid.cols[i];
			break;
		}
	}
	return ret;
}
function gridView(grid){
	if(!grid){
		return;
	}
	if(!grid.cols || grid.cols.length==0){
		crtTable();
		return;
	}
	var dset = findDatasetById(grid.datasetid);
	var dsource = findDatasourceById(dset.dsid);
	showloading();
	$.ajax({
	   type: "POST",
	   url: "GridView.action",
	   dataType:"html",                                            
	   data: {"gridJson":JSON.stringify(grid), params:(pageInfo.params?JSON.stringify(pageInfo.params):"[]"), dset:JSON.stringify(dset), dsource:JSON.stringify(dsource)},
	   success: function(resp){
		  hideLoading();
		  $("#T2 div.ctx").html(resp);
		   
		 //重新注册拖放事件(从指标拖入的事件)
		 fireDropEvent();
	   },
	   error:function(resp){
		   hideLoading();
		   $.messager.alert('出错了','系统出错，请联系管理员。','error');
	   }
	});
}
//明细表分页
function tablePagination(pageNumber, pageSize, dgId, params){
	pageNumber = pageNumber - 1; 
	var grid = pageInfo.grid;
	grid.pageSize = pageSize;
	var dset = findDatasetById(grid.datasetid);
	var dsource = findDatasourceById(dset.dsid);
	showloading();
	$.ajax({
	   type: "POST",
	   url: "GridView.action",
	   dataType:"html",                                            
	   data: {"gridJson":JSON.stringify(grid), params:(pageInfo.params?JSON.stringify(pageInfo.params):"[]"), dset:JSON.stringify(dset), dsource:JSON.stringify(dsource),currPage:pageNumber},
	   success: function(resp){
		  hideLoading();
		  $("#T2 div.ctx").html(resp);
		   
		 //重新注册拖放事件(从指标拖入的事件)
		 fireDropEvent();
	   },
	   error:function(resp){
		   hideLoading();
		   $.messager.alert('出错了','系统出错，请联系管理员。','error');
	   }
	});
}
function gridColsort(tp){
	var id = curTmpInfo.colId;
	var col = findColById(id);
	//清楚其他字段的排序
	for(i=0; i<pageInfo.grid.cols.length; i++){
		delete pageInfo.grid.cols[i].sort;
	}
	if(tp != ""){
		col.sort = tp;
	}
	curTmpInfo.isupdate = true;
	gridView(pageInfo.grid);
}
function tableColmove(tp){
	var id = curTmpInfo.colId;
	var dims = pageInfo.grid.cols;
	if(dims.length <= 1){
		msginfo('无效移动。');
		return;
	}
	for(var i=0; i<dims.length; i++){
		if(dims[i].id == id){
			if(tp == 'left'){
				if(i <= 0){
					msginfo('无效移动。');
					return;
				}else{
					var tp = dims[i - 1];
					dims[i - 1] = dims[i];
					dims[i] = tp;
					curTmpInfo.isupdate = true;
					gridView(pageInfo.grid);
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
					gridView(pageInfo.grid);
					return;
				}
			}
			break;
		}
	}
}
function delTableCol(id){
	var grid = pageInfo.grid;
	var idx = -1;
	for(i=0; i<grid.cols.length; i++){
		var c = grid.cols[i];
		if(c.id == id){
			idx = i;
			break;
		}
	}
	grid.cols.splice(idx, 1);
	gridView(grid);
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
					handler:function(){
						var tp = curTmpInfo.expType;
						$("#expff #type").val(tp);
						$("#expff #json").val(JSON.stringify(pageInfo));
						if(!pageInfo.grid){
							msginfo("报表无内容。");
							return;
						}
						$("#expff").submit();
						$('#pdailog').dialog('close');
					}
				},{
					text:'取消',
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
//对密码进行重新编码
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
					handler:function(){
						$('#pdailog').dialog('close');
					}
				}]
	});
}
function showloading(){
	var doc = jQuery(document);
	var win = jQuery(window);
	var t = doc.scrollTop() +  60;
	var l = doc.scrollLeft() + win.width() - 200;
	$("#Cloading").css({'top':t, 'left':l, 'display':'block'});
}
function hideLoading(){
	$("#Cloading").css("display", "none");
}