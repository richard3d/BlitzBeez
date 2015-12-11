#pragma strict

var m_Style:GUIStyle = null;
var m_Color:Color = Color.white;
var m_ImgColor:Color = Color.white;
var m_FontScalar:float = 1;
var m_FontSize:float = 32;
var m_Text:String = null;
var m_Img:Texture2D = null;
var m_3D:boolean = false;
var m_Camera : GameObject; //the camera to use for 3d.
var m_Rect:Rect = new Rect(0,0,1,1);
var m_PixRect:Rect;
var m_Depth:int = 0;
var m_AnchorCenter : boolean = false;
var m_AutoScale:boolean = false;
var m_SpawnGUI:GameObject;	//a gui to spawn on our death, useful for sequencing animated gui items

function OnEnable()
{
	if(m_3D && m_Camera != null)
	{
		var v:Vector3 = m_Camera.GetComponent(Camera).WorldToViewportPoint(transform.position);
		m_Rect.x = v.x;
		m_Rect.y = v.y;
	}
}

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

	if(m_3D && m_Camera != null)
	{
		var v:Vector3 = m_Camera.GetComponent(Camera).WorldToViewportPoint(transform.position);
		m_Rect.x = v.x;
		m_Rect.y = v.y;
	}
}

function OnGUI()
{
	m_Style.fontSize = m_FontSize*m_FontScalar;
	m_Style.normal.textColor = m_Color;
	if(m_AutoScale)
	{
		m_Rect.width = GUILayoutUtility.GetRect(new GUIContent(m_Text), m_Style).width/Screen.width;
		m_Rect.height = GUILayoutUtility.GetRect(new GUIContent(m_Text), m_Style).height/Screen.height;
	}
	m_PixRect.x = m_Rect.x * Screen.width;
	m_PixRect.y = m_Rect.y * Screen.height;
	m_PixRect.width = m_Rect.width * Screen.width;
	m_PixRect.height = m_Rect.height * Screen.height;
	
	if(m_AnchorCenter)
	{
		m_PixRect.x -= m_PixRect.width*0.5;
		m_PixRect.y -= m_PixRect.height*0.5;
	}
	
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

function SetPixelRect(rect:Rect)
{
	m_PixRect = rect;
	if(m_AnchorCenter)
	{
		m_PixRect.x -= m_PixRect.width*0.5;
		m_PixRect.y -= m_PixRect.height*0.5;
	}
	m_Rect.x = m_PixRect.x / Screen.width;
	m_Rect.y = m_PixRect.y / Screen.height;
	m_Rect.width = m_PixRect.width / Screen.width;
	m_Rect.height = m_PixRect.height / Screen.height;
}

function OnDestroy()
{
	if(m_SpawnGUI != null)
	{
		GameObject.Instantiate(m_SpawnGUI);
	}
}