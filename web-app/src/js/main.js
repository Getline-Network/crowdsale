var team = [{
		"name": "Kacper Wikieł",
		"job": "CEO",
		"desc": "In bitcoin since 2011, Technology Evangelist in Fintech Poland. Experience: Physics."
	},
	{
		"name": "Olaf Tomalka",
		"job": "CTO",
		"desc": "Olaf is a developer by passion. Currently a co-founder and a CTO of Boson, where he is building digital identities on blockchain. He has worked in companies such as Microsoft and Intel, and is working with Getline to provide Ethereum expertize and smart-contracts."
	},
	{
		"name": "Sergiusz Baziński",
		"job": "TECH LEAD",
		"desc": ""
	},
	{
		"name": "Diana Koziarska",
		"job": "COO",
		"desc": "CEO of ReaktorWarsaw, organization helping startups by leading a coworking space, mentoring sessions and organising monthly OpenReaktor meetings. Co-founder of preacceleration programme ReaktorX. Ambassador of Startup Poland. Curator of Warsaw Startup Digest. Physicist."
	},
	{
		"name": "Agnieszka Jarzyńska",
		"job": "CFO",
		"desc": ""
	},
	{
		"name": "Michał Sas",
		"job": "CLO",
		"desc": "He has achieved a master degree at the University of Warsaw Law and Administration Faculty and also studied Construction at the Warsaw Military Academy. Michał has more than 5 years experience in practicing law, gathered in the Polish and international law firms. Recently he continues to work in start-up and financial regulation area (earlier Triolegal Snażyk Granicki Law Firm, now Kulicki & Młynarczyk Law Firm), he is also an expert of The New Technology Law Center at the University of Warsaw and a member of Fintech Poland Foundation."
	},
	// {
	// 	"name": "Paweł Tomczyk",
	// 	"job": "HEAD OF MARKETING",
	// 	"desc": ""
	// },
	// {
	// 	"name": "Albert Baliński",
	// 	"job": "DEVELOPER",
	// 	"desc": ""
	// },
	// {
	// 	"name": "Bartosz Stebel",
	// 	"job": "DEVELOPER",
	// 	"desc": ""
	// },
];

var advisors = [
	// {
	// 	"name": "Leon Logvinov",
	// 	"job": "0x Developr",
	// 	"desc": ""
	// },
	{
		"name": "Grzegorz Oksiuta",
		"job": "Head of Design",
		"desc": ""
	},
	{
		"name": "Przemysław Kowalczyk",
		"job": "Economy, R&amp;D",
		"desc": ""
	},
	{
		"name": "Szymon Sypniewicz",
		"job": "Economy, R&amp;D",
		"desc": ""
	}
];



var replacer = function(txt) {
	    return txt.replace(/ą/g, 'a').replace(/Ą/g, 'A')
	        .replace(/ć/g, 'c').replace(/Ć/g, 'C')
	        .replace(/ę/g, 'e').replace(/Ę/g, 'E')
	        .replace(/ł/g, 'l').replace(/Ł/g, 'L')
	        .replace(/ń/g, 'n').replace(/Ń/g, 'N')
	        .replace(/ó/g, 'o').replace(/Ó/g, 'O')
	        .replace(/ś/g, 's').replace(/Ś/g, 'S')
	        .replace(/ż/g, 'z').replace(/Ż/g, 'Z')
	        .replace(/ź/g, 'z').replace(/Ź/g, 'Z').toLowerCase().replace(/[\*\^\'\!]/g, '').split(' ').join('-');
}

var generateTeam = function(el, obj) {
	var parent = $(el);
	var elems = obj;
	$.each(elems, function(i, v) {
		parent.append('<li data-id="'+i+'">'+
				'<div class="our-team__item">'+
					'<p class="our-team__item-name"><span>'+v.job+'</span>'+v.name.split(' ')[0]+'<br />'+v.name.split(' ')[1]+'</p>'+
					'<div class="our-team__item-image__wrapper"><div class="our-team__item-image" style="background-image: url(\'images/'+replacer(v.name)+'.jpg\');"></div></div>'+
					'<div class="our-team__more">Read bio</div>'+
				'</div>'+
			'</li>');
		if(i+1 >= elems.length) {
		  parent.owlCarousel({
		    autoWidth:true,
		    nav: false
			});
		}
	});
	
	parent.find('li').on('click', function() {
		var id = $(this).attr('data-id');
		var job = elems[id].job;
		var name = elems[id].name;
		var desc = elems[id].desc;
		$('body').addClass('modal-open')
		$('.overlay').addClass('is-active');

		$('#modal-title').html("<span>"+job+"</span>"+name);
		$('#modal-desc').html(desc);
	});
}

var checkMenu = function() {
  var menu = $('.header'),
      sTop = $(window).scrollTop();

      if(sTop > 100) {
        menu.addClass('is-scrolled');
      } else {
        menu.removeClass('is-scrolled');
      }
}

var scrollParallax = function() {
	var elements = $('[data-parallax]');

	elements.each(function(m, el) {
		coords = $(window).scrollTop() / $(this).attr('data-parallax');
		$(this).css({
			'-webkit-transform': 'translateY('+coords+'px)',
			'transform': 'translateYX('+coords+'px)'
		})
	});
}

var closeModal = function() {
	$('body').removeClass('modal-open');
	$('.overlay').removeClass('is-active');
}

$(document).ready(function() {
  checkMenu();
  generateTeam('.our-team__list.first', team);
  generateTeam('.our-team__list.second', advisors);
  
  $(document).keyup(function(e) {
    if (e.keyCode == 27) {
      closeModal();
    }
  });

  $('.modal__close').on('click', function() {
		closeModal();
	});

	$(document).mouseup(function (e) {
	    if($('.overlay.is-active').length > 0) {
	      var container = $(".modal");

	      if (!container.is(e.target) && container.has(e.target).length === 0) {
	        closeModal();
	      }
	    }
	  });


  
	AOS.init({
		once: true,
    offset: 200
	});

	$('.burger').on('click', function() {
		$('body').toggleClass('modal-show');
		$(this).toggleClass('is-active');
	});
	$('.menu li a[href*=#]:not([href=#])').click(function() {
		$('.burger').removeClass('is-active');
	    if (location.pathname.replace(/^\//,'') == this.pathname.replace(/^\//,'') && location.hostname == this.hostname) {
	      var target = $(this.hash);
        self = this;
	      target = target.length ? target : $('[name=' + this.hash.slice(1) +']');
	      if (target.length) {
          
	        $('html,body').animate({
	          scrollTop: target.offset().top
	        }, 1000, function() {
            window.location.hash = self.hash.slice(1);
          });
	        return false;
	      }
	    }
	});
});

$(window).scroll(function() {
  checkMenu();
  scrollParallax();
})