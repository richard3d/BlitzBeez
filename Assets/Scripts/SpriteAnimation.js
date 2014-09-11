#pragma strict

class SpriteAnimation
{
	var name : String;
	var startFrame : int;
	var numFrames : int;
	var tileSizePixels : Vector2;
	var sheetTex : Texture2D = null;
}


var m_Clips : SpriteAnimation[];
var m_CurrClip : int = 0;
var m_PlayStatus : int; //0 is stopped, 1 is playing, 2 is paused

function Start () {

	for(var i : int = 0; i < m_Clips.length; i++)
	{
		if(m_Clips[i].sheetTex == null)
		{
		//	m_Clips[i].sheetTex = renderer.material.mainTex;
		}
	}
	
}

function StopAnimation()
{
	
}

function Update () {

	

}