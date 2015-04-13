#pragma strict
var m_Frames:Texture2D[] = null;
var m_CurrFrame:int  = 0;
var m_FPS : float = 12;
function Start () {

	Animate();

}

function Animate()
{
	while(true)
	{
		m_CurrFrame++;
		if(m_CurrFrame >= m_Frames.length)
			m_CurrFrame = 0;
		guiTexture.texture = m_Frames[m_CurrFrame];
		if(m_CurrFrame == 0)
			yield WaitForSeconds(0.5);
		else
			yield WaitForSeconds(1/m_FPS);
	}
}

function Update () {

}