#pragma strict

var m_fLifetime:float =1.0;

function Start () {

	Camera.main.GetComponent(MotionBlur).enabled = true;
	Camera.main.animation["CameraDramaticZoom"].speed = 1.5;
	Camera.main.animation.Play("CameraDramaticZoom");

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
	Camera.main.animation["CameraDramaticZoom"].time = Camera.main.animation["CameraDramaticZoom"].length;
	Camera.main.animation["CameraDramaticZoom"].speed = -1.0;
	Camera.main.animation.Play("CameraDramaticZoom");
	Camera.main.GetComponent(MotionBlur).enabled = false;
}