#pragma strict

var m_PeekSound:AudioClip = null;
var m_HideSound:AudioClip = null;

function Awake()
{
	GetComponent.<Renderer>().enabled = false;
}

function Start () {


}

function Update () {



}

function Appear()
{
	GetComponent.<Renderer>().enabled = true;
	AudioSource.PlayClipAtPoint(m_PeekSound, Camera.main.transform.position);
	
}

function Peek()
{
	
	GetComponent.<Animation>().Play("BearPeek");
	
}

function PlayHideSound()
{
	AudioSource.PlayClipAtPoint(m_HideSound, Camera.main.transform.position);
}

function Hide()
{
	GetComponent.<Animation>().Play("BearIntro");
	
}



