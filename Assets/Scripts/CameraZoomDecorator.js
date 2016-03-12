#pragma strict

var m_fLifetime:float =1.0;
var m_ZoomFOV:float = 45;;

function Start () {

	gameObject.GetComponent(MotionBlur).enabled = true;
	// gameObject.animation["CameraDramaticZoom"].speed = 1.5;
	// gameObject.animation.Play("CameraDramaticZoom");
	Zoom(gameObject.GetComponent.<Camera>().fov, m_ZoomFOV);

}

function Zoom(from:float, to:float)
{
	var time:float = m_fLifetime;
	while(m_fLifetime > 0)
	{
		gameObject.GetComponent.<Camera>().fov = Mathf.Lerp(from,to,1-m_fLifetime/time);
		m_fLifetime -= 0.016;
		
		if(m_fLifetime <= 0)
		{
			Destroy(this);
		}
		yield WaitForSeconds(0.016);
	}
}

function ZoomCycle(from:float, to:float)
{
}

function Update () {


}

function OnDestroy()
{
	// gameObject.animation["CameraDramaticZoom"].time = gameObject.animation["CameraDramaticZoom"].length;
	// gameObject.animation["CameraDramaticZoom"].speed = -1.0;
	// gameObject.animation.Play("CameraDramaticZoom");
	//gameObject.camera.fov = 45;
	gameObject.GetComponent(MotionBlur).enabled = false;
}