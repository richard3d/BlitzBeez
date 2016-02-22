#pragma strict

class ClientNetworkInfo
{
	var m_ID : int = -1;
	var m_IPAddr : String;
	var m_Port : int = -1;
	var m_LocalClient:boolean = false;	
	var m_JoyNum : int = -1;
	var m_Name : String;
	var m_SkinColor: Color = Color.yellow;
	var m_Color: Color = Color.yellow;
	var m_Swag: String = "";
	var m_Side:int = 0;
	var m_EyeIndex : int = 0;
	var m_MouthIndex : int = 0;
	var m_TotalScore:int = 0;
	var m_Player : NetworkPlayer;
	var m_GameObject : GameObject = null;
	var m_LevelLoaded : boolean = false;
}