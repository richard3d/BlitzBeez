#pragma strict
var m_ActivateSound : AudioClip = null;
var m_DeathSound : AudioClip = null;
var m_Lifetime : float = 1;
var m_KillChildren : boolean = true;
function Start () {

	var src : AudioSource = GetComponent(AudioSource) as AudioSource;
	if(src != null)
		src.Play();
	

}

function Update () {

	m_Lifetime -= Time.deltaTime;
	if(m_Lifetime <= 0.0)
	{
	
		if(!m_KillChildren)
		{
			for(var t:Transform in gameObject.transform)
			{
				t.parent = null;
			}
		}
		Destroy(gameObject);
	}

}