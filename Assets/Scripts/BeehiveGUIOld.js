#pragma strict

public class MenuListener implements GUIEventListener
{
	public var m_CurrData :String[];
	public var  m_nView:NetworkView;
	function OnItemClick(menu:GUIMenu, itemIndex:int ){
	
		if(GUIMenu.m_MenuSelStack.Count > 1)
		{
			//get the main category selection (0 index in the stack). This value is the attribute name we pass for MakePurchase
			var sel:int = GUIMenu.m_MenuSelStack[0].m_SelIndex;

			var subSelIndex : int = 0;
			if(GUIMenu.m_MenuSelStack.Count > 2)
				subSelIndex = GUIMenu.m_MenuSelStack[GUIMenu.m_MenuSelStack.Count-2].m_SelIndex;
			//GUIMenu.m_MenuSelStack.Last().m_Menu[
			if(m_CurrData != null && m_CurrData.length >= 2)
				m_nView.RPC("MakePurchase", RPCMode.All, GUIMenu.m_MenuSelStack[0].m_Menu.m_MenuItems[sel].m_Text,itemIndex,subSelIndex,float.Parse(m_CurrData[1]));
		}
		
	}
	function OnItemMouseEnter(menu:GUIMenu , itemIndex:int){
	
		var delimiters:char = ':'[0];
		m_CurrData = menu.m_MenuItems[itemIndex].m_Data.Split(delimiters);
	}
	function OnItemMouseExit(menu:GUIMenu ,  itemIndex:int){
	}
}

public class MenuThumbnail
{
	var m_Tex2D:Texture2D;
	var m_Name:String;
}

var m_GUISkin : GUISkin = null;
var m_BGTexture : Texture2D = null;
var m_bShow : boolean = false;
private var m_Fade : float = 0;


//5811377
 var m_MainSelIndex : int = 0;
 var m_SubSelIndex : int = 0;
 var m_ItemSelIndex : int = -1;

var m_WeaponsMenu : GUIMenu;
var m_StatsMenu : GUIMenu;
var m_HiveMenu : GUIMenu;
var m_MainMenu : GUIMenu;

var m_MenuThumbnails : MenuThumbnail[];

private var m_CurrSelMenu:Array = new Array(); //the main menu or submenu that we have currently selected
private var m_MenuListener:MenuListener = new MenuListener();

private function FindThumnail(name:String) : Texture2D
{
	for (var i = 0; i < m_MenuThumbnails.length;i++)
	{
		if(m_MenuThumbnails[i].m_Name.ToLower() == name.ToLower())
		{
			return m_MenuThumbnails[i].m_Tex2D;
		}
	}
	return null;
}

function Start () {
	
	//set appropriate styles
	 m_StatsMenu.m_Position.y = Screen.height*0.33+50;
	 m_HiveMenu.m_Position.y = Screen.height*0.66+50;
	 m_WeaponsMenu.m_Style = m_GUISkin.customStyles[0];
	 m_StatsMenu.m_Style = m_GUISkin.customStyles[0];
	 m_HiveMenu.m_Style = m_GUISkin.customStyles[0];
	 
	 for(var i = 0; i < m_WeaponsMenu.m_MenuItems.length; i++)
	 {
		m_WeaponsMenu.m_MenuItems[i].m_SubMenu.m_Style  = m_GUISkin.customStyles[1];
	 }
	 for(i = 0; i < m_StatsMenu.m_MenuItems.length; i++)
	 {
		m_StatsMenu.m_MenuItems[i].m_SubMenu.m_Style  = m_GUISkin.customStyles[1];
	 }
	 for( i = 0; i < m_HiveMenu.m_MenuItems.length; i++)
	 {
		m_HiveMenu.m_MenuItems[i].m_SubMenu.m_Style  = m_GUISkin.customStyles[1];
	 }
	 
	 //register event listeners
	 m_MenuListener.m_nView = GetComponent.<NetworkView>();
	 m_WeaponsMenu.RegisterEventListener(m_MenuListener);
	 m_StatsMenu.RegisterEventListener(m_MenuListener);
	 m_HiveMenu.RegisterEventListener(m_MenuListener);
}

function Update () {
	
	 if(!m_bShow)
		 return;
	
	if(Input.GetAxis("Use Item/Interact"))
	{
	
	}
	
	//if the user clicks off the menu( there is no valid sel index );
	if (Input.GetMouseButtonDown(0) && GUIMenu.m_FocusedItem.m_SelIndex == -1)
	{
		//hide the menu
		for(var i = 0 ; i < m_WeaponsMenu.m_MenuItems.Length; i++)
			m_WeaponsMenu.m_MenuItems[i].m_SubMenu.Show(false);
		for(i = 0 ; i < m_HiveMenu.m_MenuItems.Length; i++)
			m_HiveMenu.m_MenuItems[i].m_SubMenu.Show(false);
		for(i = 0 ; i < m_StatsMenu.m_MenuItems.Length; i++)
			m_StatsMenu.m_MenuItems[i].m_SubMenu.Show(false);
	}
}

function OnNetworkInput(IN : InputState)
{

	if(!GetComponent.<NetworkView>().isMine)
	{
		return;
	}
	if(IN.GetActionBuffered(IN.USE))
	{
		
		if(Network.isServer && m_Fade >= 1)
			GetComponent.<NetworkView>().RPC("ShowHiveGUI", RPCMode.All, 0, "Hive");
			// ExitHive();
		// else
			// networkView.RPC("ExitHive", RPCMode.Server);
			// networkView.RPC("ShowHiveGUI", RPCMode.All, 0, "Hive");
	}
}

//this is only executed on the server
@RPC function ExitHive()
{
	//networkView.RPC("ShowHiveGUI", RPCMode.All, 0, "Hive");
}

@RPC function MakePurchase(attr:String, itemIndex:int,subSelIndex:int, cost:float)
{
	//if there is a valid sub selection index add 1 to it, to bias it for multiplication with the item index
	
	Debug.Log("menu "	+attr+ " Sel " +(itemIndex+subSelIndex*3));
	var bee: BeeControllerScript = GetComponent(BeeControllerScript);
	if(GetComponent(BeeScript).m_Money >= cost)
	{
		GetComponent(BeeScript).m_Money -= cost;
		bee.m_Stats[attr] = (itemIndex+subSelIndex*3);
		
		if(attr == "Loadout")
		{
			GetComponent(BeeControllerScript).m_Stats["Fire Rate"] = -1;
			GetComponent(BeeControllerScript).m_Stats["Clip Size"] = -1;
			GetComponent(BeeControllerScript).m_Stats["Reload Speed"] = -1;
		}
		else if(attr == "Clip Size")
		{
			GetComponent(BeeControllerScript).Reload();
			GetComponent(BeeControllerScript).QuickReload();
		}
	}
}

function Show(bShow : boolean)
{
	m_bShow = bShow;
	
	if(m_bShow)
	{
		Cursor.visible = true;
		Debug.Log("Showing");
		m_MainSelIndex = 0;
		//m_CurrSelMenu.Push(m_MainMenu);
		//m_MainMenu.m_MenuItems[0].m_Color = Color.yellow;
	}
	else
	{
		Cursor.visible = false;
		
		m_Fade = 0;
		Camera.main.orthographicSize = 100;
		
		Debug.Log("Hiding");
		//hide the menu
		GUIMenu.m_FocusedItem.m_SelIndex = -1;
		GUIMenu.m_FocusedItem.m_Menu = null;
		for(var i = 0 ; i < m_WeaponsMenu.m_MenuItems.Length; i++)
			m_WeaponsMenu.m_MenuItems[i].m_SubMenu.Show(false);
		for(i = 0 ; i < m_HiveMenu.m_MenuItems.Length; i++)
			m_HiveMenu.m_MenuItems[i].m_SubMenu.Show(false);
		for(i = 0 ; i < m_StatsMenu.m_MenuItems.Length; i++)
			m_StatsMenu.m_MenuItems[i].m_SubMenu.Show(false);
	}
}

function OnGUI()
{
	if(m_bShow)
	{	
		if(m_Fade < 1 && m_bShow)
		{
			m_Fade += Time.deltaTime * 2;
			Camera.main.orthographicSize -= Time.deltaTime * 90;
		}
		var myDisplay : boolean  = false;
		if(NetworkUtils.IsControlledGameObject(gameObject)) {
				myDisplay = true;
		}
		
		if(myDisplay  == true)
		{
			//first fade in the background
			
			//GUI.color = Color.black;
			GUI.color.a = m_Fade;
			GUI.DrawTexture(Rect(0,0, Screen.width, Screen.height), m_BGTexture);
			
			
			
			var btnWidth : float = 200;
			var btnHeight : float = 25;
			
			
			if(m_Fade >= 1)
			{
				GUI.color = Color.white;
				//draw info text
				if(m_CurrSelMenu.length > 0)
				{
					var menu:GUIMenu = m_CurrSelMenu[m_CurrSelMenu.length-1];
					if(m_MainSelIndex != -1)
					{
					//	var desc = menu.m_MenuItems[m_MainSelIndex].m_Description;
					//	GUI.Label(Rect(Screen.width * 0.05, Screen.height * 0.04, 600, 54), desc, m_InfoStyle);
					}
				}
				
				var bgHeight = Screen.height*0.33-8;
				//else				
				//	GUI.Label(Rect(Screen.width * 0.05, Screen.height * 0.04, 600, 54), "Select a menu option below", m_InfoStyle);
				//GUI.color.a = 0.5;
				//draw the menu titles & draw the menu items
				//yellow base background
				GUI.color.a = 0.75;
				GUI.Label(Rect(815, 0, Screen.width-815, Screen.height),"", m_GUISkin.customStyles[2]);
				GUI.color.a = 1;
				//white dialog background
				GUI.Label(Rect(815, 264, Screen.width-815, 32),"", m_GUISkin.customStyles[5]);
				//white pricing background
				GUI.Label(Rect(815, 4, Screen.width-815, 256),"", m_GUISkin.customStyles[5]);
				if(m_MenuListener.m_CurrData != null)
				{
					if(m_MenuListener.m_CurrData.length >= 1 )
					{
						GUI.Label(Rect(815, 4, Screen.width-815, 256),m_MenuListener.m_CurrData[0], m_GUISkin.label);
					}
					if(m_MenuListener.m_CurrData.length >= 2)
					{
						if(GetComponent(BeeControllerScript).m_Stats[m_MenuListener.m_CurrData[0]] != -1)
						{
							//GUI.Label(Rect(815, 264, Screen.width-815, 32),"Already Purchased", m_GUISkin.label);
						}
						GUI.Label(Rect(815, 264, Screen.width-815, 32),"Money: $"+GetComponent(BeeScript).m_Money+"                  Cost: $"+m_MenuListener.m_CurrData[1], m_GUISkin.label);
					}
					if(m_MenuListener.m_CurrData.length == 3)
					{
						GUI.Label(Rect(815, 300, Screen.width-815, 128),FindThumnail(m_MenuListener.m_CurrData[2]),m_GUISkin.label);
					}
				}
				
				GUI.Label(Rect(815, 300, Screen.width-815, 304),"", m_GUISkin.customStyles[5]);
				var count = 0;
				for(var prop in GetComponent(BeeControllerScript).m_Stats)
				{
						var val:int = prop.Value;
						GUI.Label(Rect(815, 304+32*count, Screen.width-815, 32),prop.Key+": +" +(val+1),m_GUISkin.label);
						count++;
				}
				
				//draw the menu titles & draw the menu items
				GUI.color.a = 0.75;
				GUI.Label(Rect(0, 0, 800, bgHeight),"", m_GUISkin.customStyles[2]);
				GUI.color.a = 1;
				GUI.Label(Rect(0, 50, 800, 30),"", m_GUISkin.customStyles[4]);
				GUI.Label(Rect(0, 0, 800, 300),"Weapons", m_GUISkin.customStyles[3]);
				m_WeaponsMenu.DrawMenu();
				
				GUI.color.a = 0.75;
				GUI.Label(Rect(0, Screen.height*0.33+8, 800, bgHeight),"", m_GUISkin.customStyles[2]);
				GUI.color.a = 1;
				GUI.Label(Rect(0, Screen.height*0.33+50, 800, 30),"", m_GUISkin.customStyles[4]);
				GUI.Label(Rect(0, Screen.height*0.33, 800, 300),"Stats", m_GUISkin.customStyles[3]);
				m_StatsMenu.DrawMenu();	
				
				GUI.color.a = 0.75;
				GUI.Label(Rect(0, Screen.height*0.66+16, 800, bgHeight),"", m_GUISkin.customStyles[2]);
				GUI.color.a = 1;
				GUI.Label(Rect(0, Screen.height*0.66+50, 800, 30),"", m_GUISkin.customStyles[4]);
				GUI.Label(Rect(0, Screen.height*0.66, 800, Screen.height*0.3),"Hive", m_GUISkin.customStyles[3]);
				m_HiveMenu.DrawMenu();					
			}
		}
	}
}