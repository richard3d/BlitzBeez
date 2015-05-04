#pragma strict

class TutorialScene
{
	var m_Title:String;
	var m_Text:String;
	var m_Textures:Texture2D[];
	var m_TextureIndex:int = 0;
	var m_Play:boolean  = false;
}





var m_Scenes:TutorialScene[] = null;
var m_CurrScene:int = 0;
var m_MenuPos:Vector2;
var m_IsAnimating = false;
var m_GUISkin:GUISkin = null;
function ResetMenu(left:boolean)
{
	if(left)
		m_MenuPos = Vector2(-Screen.width, Screen.height*0.25);
	else
		m_MenuPos = Vector2(Screen.width, Screen.height*0.25);
}

function MenuEnter(fwrd:boolean)
{
	while(m_IsAnimating)
		yield WaitForSeconds(0.0166);
		
		
	m_IsAnimating = true;
	ResetMenu(fwrd);
	
	
	while(m_MenuPos.x != 0)
	{
		m_MenuPos.x = Mathf.Lerp(m_MenuPos.x,0,0.0166*20);
		if(Mathf.Abs(m_MenuPos.x) < 1)
			break;
		yield WaitForSeconds(0.0166);
	}
	m_IsAnimating = false;
	
}

function MenuExit(fwrd:boolean)
{
	while(m_IsAnimating)
		yield WaitForSeconds(0.0166);

	m_IsAnimating = true;
	
	var vel:float = Screen.width*0.5;
	var accel :float = Screen.width*40;
	if(fwrd)
	{
		
		while(Mathf.Abs(m_MenuPos.x) <  Screen.width)
		{
			vel += accel * 0.0166;
			m_MenuPos.x += vel*0.0166;//Mathf.Lerp(m_MenuPos.x,Screen.width,0.0166*20);
			yield WaitForSeconds(0.0166);
		}
	}
	else
	{
		while(m_MenuPos.x > -Screen.width)
		{
			vel += accel * 0.0166;
			m_MenuPos.x -= vel*0.0166;
			yield WaitForSeconds(0.0166);
		}
	}
	m_IsAnimating = false;
	
	if(fwrd)
	{
		m_CurrScene++;
		if(m_CurrScene > m_Scenes.length-1)
			GetComponent(MultiplayerMainMenuGUI).HideTutorial();
	}
	else
	{
		m_CurrScene--;
		if(m_CurrScene < 0)
			GetComponent(MultiplayerMainMenuGUI).HideTutorial();
	}
}

function PlayScene(index:int)
{
	
	m_Scenes[index].m_Play = true;
	while(m_Scenes[index].m_Play)
		{
			yield WaitForSeconds(0.5);
			m_Scenes[index].m_TextureIndex++;
			if(m_Scenes[index].m_TextureIndex > m_Scenes[index].m_Textures.length-1)
				m_Scenes[index].m_TextureIndex = 0;
		}
}

function StopScene(index:int)
{
	m_Scenes[index].m_Play = false;
}


function OnEnable()
{
	m_CurrScene = 0;
	MenuEnter(true);
}

function Start () {

	PlayScene(0);
	PlayScene(1);
	PlayScene(2);
	//m_Scenes[0].PlayTut();

}

function Update () {

	if(Input.GetAxis("Joy0 OK") && !m_IsAnimating)
	{
		
		//if(m_CurrScene > m_Scenes.length-1)
			
		MenuExit(true);
		MenuEnter(true);
		
	}
	
	if(Input.GetAxis("Joy0 Cancel") && !m_IsAnimating)
	{
		
		//if(m_CurrScene > m_Scenes.length-1)
			
		MenuExit(false);
		MenuEnter(false);
		
	}

}

function OnGUI()
{
	GUI.BeginGroup (Rect(m_MenuPos.x, m_MenuPos.y, Screen.width,Screen.height*0.5+136),m_GUISkin.GetStyle("Background"));	
	GUI.Label(Rect(0,0,Screen.width,64),m_Scenes[m_CurrScene].m_Title,m_GUISkin.GetStyle("Heading"));
	//GUILayout.Label(m_Scenes[m_CurrScene].m_Textures[m_Scenes[m_CurrScene].m_TextureIndex],m_GUISkin.GetStyle("Heading"), GUILayout.ExpandHeight(true));
	GUI.backgroundColor = Color32(61,151,200,255);
	GUI.Label(Rect(0,68,Screen.width,Screen.height*0.5)," ", m_GUISkin.label);
	GUI.DrawTexture(Rect(Screen.width*0.5-256,68,512,Screen.height*0.5), m_Scenes[m_CurrScene].m_Textures[m_Scenes[m_CurrScene].m_TextureIndex],ScaleMode.ScaleToFit);
	
	GUI.backgroundColor = Color(0,0,0,0.5);
	//GUI.backgroundColor
	GUI.Label(Rect(0,Screen.height*0.5+72,Screen.width,64),m_Scenes[m_CurrScene].m_Text,m_GUISkin.label);
	GUI.EndGroup();
	//GUI.DrawTexture(Rect(300,0,256,256), m_Scenes[1].m_Textures[m_Scenes[1].m_TextureIndex]);
}

