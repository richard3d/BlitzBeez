#pragma strict

static function ShowRecursive(t:Transform)
{
	if(t != null)
	{
		if(t.GetComponent(Renderer) != null)
			t.GetComponent(Renderer).enabled = true;
		for(var child:Transform in t)
		{
			ShowRecursive(child);
		}
	}
	else
		return;
}

static function HideRecursive(t:Transform)
{
	if(t != null)
	{
		if(t.GetComponent(Renderer) != null)
			t.GetComponent(Renderer).enabled = false;
		for(var child:Transform in t)
		{
			ShowRecursive(child);
		}
	}
	else
		return;
}
