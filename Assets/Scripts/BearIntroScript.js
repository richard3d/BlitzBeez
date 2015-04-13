#pragma strict

var m_PeekSound:AudioClip = null;
var m_HideSound:AudioClip = null;

function Awake()
{
	renderer.enabled = false;
}

function Start () {


}

function Update () {



}

function Appear()
{
	renderer.enabled = true;
	AudioSource.PlayClipAtPoint(m_PeekSound, Camera.main.transform.position);
	
}

function Peek()
{
	
	animation.Play("BearPeek");
	
}

function PlayHideSound()
{
	AudioSource.PlayClipAtPoint(m_HideSound, Camera.main.transform.position);
}

function Hide()
{
	animation.Play("BearIntro");
	
}



