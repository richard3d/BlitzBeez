#pragma strict



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
	
}

function Peek()
{
	animation.Play("BearPeek");
}

function Hide()
{
	animation.Play("BearIntro");
}



