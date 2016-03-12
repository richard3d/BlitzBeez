#pragma strict
var m_Animation : String ="";
var m_Lifetime : float = 0.0;
var m_LifeIsAnimLength : boolean = false;
function Start () {

}

function Update () {


	if(m_Lifetime > 0.0)
	{
		m_Lifetime -= Time.deltaTime;
		if(m_Lifetime <= 0.0)	
			Destroy(this);
	}
	else
	{
		if(!GetComponent.<Animation>().isPlaying)
		{
			Destroy(this);
		}		
	}
}

function SetLifetime(time : float)
{
	m_Lifetime = time;
}

function OnDestroy()
{
	
}