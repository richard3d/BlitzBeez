#pragma strict
var m_ActivateSound : AudioClip = null;
var m_DeathSound : AudioClip = null;
var m_Lifetime : float = 1;
function Start () {

	var src : AudioSource = GetComponent(AudioSource) as AudioSource;
	if(src != null)
		src.Play();
	

}

function Update () {

m_Lifetime -= Time.deltaTime;
if(m_Lifetime <= 0.0)
Destroy(gameObject);

}