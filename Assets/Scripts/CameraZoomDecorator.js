#pragma strict

var m_fLifetime:float =1.0;

function Start () {

	gameObject.GetComponent(MotionBlur).enabled = true;
	gameObject.animation["CameraDramaticZoom"].speed = 1.5;
	gameObject.animation.Play("CameraDramaticZoom");

}

function Update () {

	if(m_fLifetime > 0)
	{
		m_fLifetime -= Time.deltaTime;
		
		if(m_fLifetime <= 0)
		{
			Destroy(this);
		}
	}
}

function OnDestroy()
{
	gameObject.animation["CameraDramaticZoom"].time = gameObject.animation["CameraDramaticZoom"].length;
	gameObject.animation["CameraDramaticZoom"].speed = -1.0;
	gameObject.animation.Play("CameraDramaticZoom");
	gameObject.GetComponent(MotionBlur).enabled = false;
}