#pragma strict

function Start () {
		Blink();
}

function Update () {

}

function Blink()
{
	var bee:GameObject = transform.GetChild(0).Find("NewBee/NewBee").gameObject;
	while(true)
	{
		yield WaitForSeconds(0.066);
		bee.renderer.materials[2].mainTextureScale = Vector2(1,8);
		bee.renderer.materials[2].mainTextureOffset = Vector2(0,-2);
		yield WaitForSeconds(0.066);
		bee.renderer.materials[2].mainTextureScale = Vector2(1,1);
		bee.renderer.materials[2].mainTextureOffset = Vector2(0,0);
		yield WaitForSeconds(Random.Range(0.5, 2));
	}
}