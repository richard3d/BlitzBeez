#pragma strict

var m_Style:GUIStyle = null;
var m_Color:Color = Color.white;
var m_ImgColor:Color = Color.white;
var m_FontScalar:float = 1;
var m_FontSize:float = 32;
var m_Text:String = null;
var m_Img:Texture2D = null;
var m_Rect:Rect = new Rect(0,0,1,1);
var m_PixRect:Rect;
var m_Depth:int = 0;


var m_SpawnGUI:GameObject;	//a gui to spawn on our death, useful for sequencing animated gui items

function Start () {

	m_Style.fontSize = m_FontSize;
	m_Style.normal.textColor = m_Color;

}

function SetCamera(cam:GameObject)
{
	m_Rect = cam.camera.rect;
	if(cam.camera.rect.y == 0.0 &&  cam.camera.rect.height == 1)
		m_Rect.y = 0;
	else
		m_Rect.y = Mathf.Abs(cam.camera.rect.y - 0.5);
}

function Update () {
}

function OnGUI()
{
	m_Style.fontSize = m_FontSize*m_FontScalar;
	m_Style.normal.textColor = m_Color;
	m_PixRect.x = m_Rect.x * Screen.width;
	m_PixRect.y = m_Rect.y * Screen.height;
	m_PixRect.width = m_Rect.width * Screen.width;
	m_PixRect.height = m_Rect.height * Screen.height;
	
	var oldD = GUI.depth;
	GUI.depth = m_Depth;
	
	var oldColor:Color = GUI.color;
	GUI.color = m_ImgColor;
	if(m_Img != null)
	{
		GUI.DrawTexture(m_PixRect, m_Img);
	}
	GUI.color = oldColor;
	
	if(m_Text != null)
	{
		GUI.Label(m_PixRect, m_Text, m_Style);
	}
	
	

}


function OnDestroy()
{
	if(m_SpawnGUI != null)
	{
		GameObject.Instantiate(m_SpawnGUI);
	}
}